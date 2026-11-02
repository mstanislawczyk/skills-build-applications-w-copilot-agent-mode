import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Activity input must be an object');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    !/^[a-f\d]{24}$/i.test(userId) ||
    typeof teamId !== 'string' ||
    !/^[a-f\d]{24}$/i.test(teamId) ||
    typeof type !== 'string' ||
    typeof minutes !== 'number' ||
    !Number.isInteger(minutes) ||
    minutes < 1
  ) {
    throw badRequest('Activity input is invalid');
  }

  const [user, team] = await Promise.all([
    User.findById(new mongoose.Types.ObjectId(userId)).select('_id'),
    Team.findById(new mongoose.Types.ObjectId(teamId)).select('_id'),
  ]);
  if (!user || !team) {
    throw badRequest('Activity user and team must exist');
  }

  try {
    return await Activity.create({
      user: user._id,
      team: team._id,
      type,
      minutes,
      points: minutes,
      occurredAt: new Date(),
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      throw badRequest('Activity input is invalid');
    }
    throw error;
  }
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Team input must be an object');
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !/^[a-f\d]{24}$/i.test(member))
  ) {
    throw badRequest('Team input is invalid');
  }

  const memberIds = [...new Set(members as string[])].map((id) => new mongoose.Types.ObjectId(id));
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) {
      throw badRequest('Team members must exist');
    }
  }

  try {
    return await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      throw badRequest('Team input is invalid');
    }
    throw error;
  }
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
