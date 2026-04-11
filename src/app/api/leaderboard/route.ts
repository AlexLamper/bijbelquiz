import { NextRequest, NextResponse } from 'next/server';
import { connectDB, UserProgress, Category } from '@/database';
import type { PipelineStage } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get time filter from query params
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get('time') || 'all';

    // Build date filter
    let dateFilter: Record<string, unknown> = {};
    const now = new Date();
    if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { $gte: weekAgo } };
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { $gte: monthAgo } };
    }

    // Recent activity threshold (played in last 7 days)
    const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pipeline: PipelineStage[] = [];

    // Apply date filter first
    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({ $match: dateFilter });
    }

    // Sort by score desc
    pipeline.push(
      { $sort: { score: -1 } },
      // Group by User and Quiz to get the best score for each unique quiz
      {
        $group: {
          _id: { userId: "$userId", quizId: "$quizId" },
          bestScore: { $max: "$score" },
          totalQuestions: { $first: "$totalQuestions" },
          lastPlayed: { $max: "$completedAt" }
        }
      },
      // Group by User to sum all their best scores
      {
        $group: {
          _id: "$_id.userId",
          totalPoints: { $sum: "$bestScore" },
          quizzesPlayed: { $sum: 1 },
          totalQuestions: { $sum: "$totalQuestions" },
          lastActivity: { $max: "$lastPlayed" }
        }
      },
      // Calculate average score percentage
      {
        $addFields: {
          avgScore: {
            $cond: {
              if: { $gt: ["$totalQuestions", 0] },
              then: { $round: [{ $multiply: [{ $divide: ["$totalPoints", "$totalQuestions"] }, 100] }, 0] },
              else: 0
            }
          },
          recentActivity: { $gte: ["$lastActivity", recentThreshold] }
        }
      },
      // Join with Users collection to get profile info
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      // Remove entries where user doesn't exist
      { $unwind: "$userInfo" },
      // Select only needed fields
      {
        $project: {
          _id: 1,
          totalPoints: "$userInfo.xp",
          quizzesPlayed: 1,
          avgScore: 1,
          recentActivity: 1,
          name: "$userInfo.name",
          image: "$userInfo.image",
          isPremium: "$userInfo.isPremium",
          streak: "$userInfo.streak",
        }
      },
      // Sort by total points descending
      { $sort: { totalPoints: -1 } },
      // Top 100
      { $limit: 100 }
    );

    const leaderboard = await UserProgress.aggregate(pipeline);

    // Convert MongoDB ObjectIds to strings for client
    const formattedLeaderboard = leaderboard.map(entry => ({
      ...entry,
      _id: entry._id.toString()
    }));

    return NextResponse.json(formattedLeaderboard);
  } catch (error) {
    console.error('[LEADERBOARD_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
