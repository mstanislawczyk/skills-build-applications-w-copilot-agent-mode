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

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
