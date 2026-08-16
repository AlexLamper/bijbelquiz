import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * A group of players kept after the game they met in.
 *
 * A multiplayer room dies the moment it finishes, which throws away the one
 * thing worth keeping: the fact that these eight people play together. A saved
 * group turns that into a standing rivalry - a leaderboard of just them, and a
 * one-tap re-invite next Thursday.
 *
 * Deliberately unrelated to `GroupLicense`. That one is billing: seats, a join
 * code, Premium inheritance. This one is social and free, and conflating them
 * would mean you cannot have friends without buying something.
 */

export interface IPlayerGroup extends Document {
  /** Shown in the group list, e.g. "Jongerengroep donderdag". */
  name: string;
  /** The account that saved it. Also always a member. */
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  /** The room this group was made from, kept for support questions. */
  createdFromRoomCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerGroupSchema = new Schema<IPlayerGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Indexed because the only listing query is "every group I am in", which
    // is a membership test, not an ownership test.
    memberIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [], index: true },
    createdFromRoomCode: { type: String, default: null, uppercase: true, trim: true },
  },
  { timestamps: true },
);

// The listing query: my groups, newest first.
PlayerGroupSchema.index({ memberIds: 1, createdAt: -1 });

const PlayerGroup: Model<IPlayerGroup> =
  mongoose.models.PlayerGroup || mongoose.model<IPlayerGroup>('PlayerGroup', PlayerGroupSchema);

export default PlayerGroup;
