import Need from '../models/Need.js';
import User from '../models/User.js';
import { getDistanceKm } from '../utils/distance.js';

export const getMatchesForNeed = async (needId) => {
  const need = await Need.findById(needId);
  if (!need) throw new Error('Need not found');

  // Find all active volunteers who are currently available
  const availableVolunteers = await User.find({
    role: 'volunteer',
    status: 'active',
    isDeleted: false,
    'profile.availability': true
  });

  const matches = availableVolunteers.map(volunteer => {
    // 1. Calculate Distance Score
    const distance = getDistanceKm(volunteer.profile.location, need.location);
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

    // 2. Calculate Skill Score — skills are now {name, description} objects
    const skillNames = (volunteer.profile.skills || []).map(s => (typeof s === 'string' ? s : s.name).toLowerCase());
    const skillMatch = skillNames.includes(need.category.toLowerCase());
    const skillScore = skillMatch ? 0.50 : 0.00;

    // 3. Availability Score (already filtered for available = true)
    const availabilityScore = 0.20;

    // Total Score (out of 1.00 => scaled to 100 later or kept as float)
    const totalScoreFloat = skillScore + distanceScore + availabilityScore;
    const totalScore = +(totalScoreFloat * 100).toFixed(0);

    // Build the Explanation Layer
    const matchExplanation = [];
    if (skillMatch) {
      matchExplanation.push(`✅ Matches required skill: ${need.category.toUpperCase()} (+50)`);
    } else {
      matchExplanation.push(`❌ Lacks required skill: ${need.category.toUpperCase()} (+0)`);
    }
    matchExplanation.push(`✅ Proximity: ${distanceLabel} (+${distanceScore * 100})`);
    matchExplanation.push(`✅ Status: Currently Available (+20)`);

    return {
      volunteerId: volunteer._id,
      volunteerName: volunteer.name,
      score: totalScore,
      distance: +distance.toFixed(1),
      matchExplanation
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
