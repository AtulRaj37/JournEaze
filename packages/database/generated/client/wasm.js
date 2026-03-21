
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  username: 'username',
  name: 'name',
  image: 'image',
  passwordHash: 'passwordHash',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TripScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  destination: 'destination',
  destinationCity: 'destinationCity',
  destinationCountry: 'destinationCountry',
  latitude: 'latitude',
  longitude: 'longitude',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  travelType: 'travelType',
  budget: 'budget',
  currency: 'currency',
  coverImage: 'coverImage',
  aiItinerary: 'aiItinerary',
  aiPackingList: 'aiPackingList',
  aiTravelTips: 'aiTravelTips',
  aiCustomPrompt: 'aiCustomPrompt',
  explorePlaces: 'explorePlaces',
  mapPins: 'mapPins',
  weatherCache: 'weatherCache',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  creatorId: 'creatorId'
};

exports.Prisma.TripMemberScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  userId: 'userId',
  role: 'role',
  joinedAt: 'joinedAt'
};

exports.Prisma.ItineraryDayScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  date: 'date',
  dayNumber: 'dayNumber'
};

exports.Prisma.ItineraryActivityScalarFieldEnum = {
  id: 'id',
  dayId: 'dayId',
  title: 'title',
  description: 'description',
  startTime: 'startTime',
  endTime: 'endTime',
  latitude: 'latitude',
  longitude: 'longitude',
  locationName: 'locationName',
  costEstimate: 'costEstimate',
  orderIndex: 'orderIndex',
  createdById: 'createdById'
};

exports.Prisma.ExpenseScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  payerId: 'payerId',
  amount: 'amount',
  description: 'description',
  category: 'category',
  date: 'date',
  createdAt: 'createdAt'
};

exports.Prisma.ExpenseSplitScalarFieldEnum = {
  id: 'id',
  expenseId: 'expenseId',
  userId: 'userId',
  amount: 'amount'
};

exports.Prisma.SettlementScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  payerId: 'payerId',
  receiverId: 'receiverId',
  amount: 'amount',
  status: 'status',
  date: 'date'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  userId: 'userId',
  content: 'content',
  createdAt: 'createdAt'
};

exports.Prisma.PollScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  createdById: 'createdById',
  question: 'question',
  createdAt: 'createdAt',
  endsAt: 'endsAt'
};

exports.Prisma.PollOptionScalarFieldEnum = {
  id: 'id',
  pollId: 'pollId',
  text: 'text'
};

exports.Prisma.VoteScalarFieldEnum = {
  id: 'id',
  pollId: 'pollId',
  optionId: 'optionId',
  userId: 'userId'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  uploadedById: 'uploadedById',
  title: 'title',
  url: 'url',
  type: 'type',
  createdAt: 'createdAt'
};

exports.Prisma.ActivityLogScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  userId: 'userId',
  action: 'action',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  body: 'body',
  isRead: 'isRead',
  type: 'type',
  link: 'link',
  createdAt: 'createdAt'
};

exports.Prisma.NoteScalarFieldEnum = {
  id: 'id',
  tripId: 'tripId',
  userId: 'userId',
  content: 'content',
  fileUrl: 'fileUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AiDestinationCacheScalarFieldEnum = {
  id: 'id',
  destination: 'destination',
  overview: 'overview',
  highlights: 'highlights',
  explorePlaces: 'explorePlaces',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.SystemRole = exports.$Enums.SystemRole = {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

exports.TripStatus = exports.$Enums.TripStatus = {
  PLANNING: 'PLANNING',
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED'
};

exports.TravelType = exports.$Enums.TravelType = {
  SOLO: 'SOLO',
  COUPLE: 'COUPLE',
  FRIENDS: 'FRIENDS',
  FAMILY: 'FAMILY'
};

exports.MemberRole = exports.$Enums.MemberRole = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER'
};

exports.Prisma.ModelName = {
  User: 'User',
  Trip: 'Trip',
  TripMember: 'TripMember',
  ItineraryDay: 'ItineraryDay',
  ItineraryActivity: 'ItineraryActivity',
  Expense: 'Expense',
  ExpenseSplit: 'ExpenseSplit',
  Settlement: 'Settlement',
  Message: 'Message',
  Poll: 'Poll',
  PollOption: 'PollOption',
  Vote: 'Vote',
  Document: 'Document',
  ActivityLog: 'ActivityLog',
  Notification: 'Notification',
  Note: 'Note',
  AiDestinationCache: 'AiDestinationCache'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
