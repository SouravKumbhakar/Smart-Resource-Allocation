import Need from '../models/Need.js';
import Volunteer from '../models/Volunteer.js';
import { getDistanceKm } from '../utils/distance.js';

export const getMatchesForNeed = async (needId) => {
  const need = await Need.findById(needId);
  if (!need) throw new Error('Need not found');

  // Find all volunteers who are currently available
  const availableVolunteers = await Volunteer.find({ availability: true }).populate('userId', 'name email');

  const matches = availableVolunteers.map(volunteer => {
    // 1. Calculate Distance Score
    const distance = getDistanceKm(volunteer.location, need.location);
    let distanceScore = 0;
    let distanceLabel = "> 10 km";
    if (distance < 2) {
      distanceScore = 0.30;
      distanceLabel = "< 2 km";
    } else if (distance < 5) {
      distanceScore = 0.18;
      distanceLabel = "< 5 km";
    } else if (distance < 10) {
      distanceScore = 0.09;
      distanceLabel = "< 10 km";
    }

    // 2. Calculate Skill Score
    const skillMatch = volunteer.skills.includes(need.category);
    const skillScore = skillMatch ? 0.50 : 0.00;

    // 3. Availability Score (already filtered for available = true)
    const availabilityScore = 0.20;

    // Total Score
    const totalScore = +(skillScore + distanceScore + availabilityScore).toFixed(2);

    return {
      volunteerId: volunteer._id,
      volunteerName: volunteer.userId.name,
      score: totalScore,
      distance: +distance.toFixed(1),
      scoreBreakdown: {
        skillScore,
        distanceScore,
        availabilityScore
      },
      reasons: {
        skillMatch,
        distanceLabel,
        available: true
      }
    };
  });

  // Sort by highest score, then by shortest distance
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.distance - b.distance;
  });

  // Return top 5 matches
  return matches.slice(0, 5);
};
