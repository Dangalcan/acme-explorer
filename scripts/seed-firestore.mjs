import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFilePath = path.join(__dirname, 'seed-data.json');
const firebaseConfigPath = path.join(__dirname, 'firebase-client.config.json');

const adminEmail = process.env.FIREBASE_ADMIN_EMAIL;
const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error('Missing credentials. Set FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD env vars.');
  process.exit(1);
}

const toTimestamp = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return Timestamp.fromDate(parsed);
};

const pruneUndefined = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => pruneUndefined(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, nested]) => [key, pruneUndefined(nested)])
      .filter(([, nested]) => nested !== undefined);
    return Object.fromEntries(entries);
  }

  return value === undefined ? undefined : value;
};

const toTripPayload = (trip, legacyToUid) => {
  const managerUid = legacyToUid.get(trip.managerId);
  if (!managerUid) {
    throw new Error(`Manager UID not found for legacy id: ${trip.managerId}`);
  }

  return {
    version: trip.version ?? 0,
    ticker: trip.ticker,
    title: trip.title,
    description: trip.description,
    managerId: managerUid,
    stages: (trip.stages ?? []).map((stage) => ({
      id: String(stage.id),
      version: Number(stage.version ?? 0),
      title: String(stage.title ?? ''),
      description: String(stage.description ?? ''),
      price: Number(stage.price ?? 0),
    })),
    location: trip.location
      ? {
          city: String(trip.location.city ?? ''),
          country: String(trip.location.country ?? ''),
        }
      : undefined,
    difficultyLevel: trip.difficultyLevel,
    maxParticipants: Number(trip.maxParticipants ?? 0),
    startDate: toTimestamp(trip.startDate),
    endDate: toTimestamp(trip.endDate),
    cancellation: trip.cancellation
      ? {
          reason: String(trip.cancellation.reason ?? ''),
          cancelledAt: toTimestamp(trip.cancellation.cancelledAt),
        }
      : undefined,
    pictures: Array.isArray(trip.pictures)
      ? trip.pictures.map((picture) => ({ url: String(picture.url ?? '') }))
      : undefined,
  };
};

const toApplicationPayload = (application, legacyToUid) => {
  const explorerUid = legacyToUid.get(application.explorerId);
  if (!explorerUid) {
    throw new Error(`Explorer UID not found for legacy id: ${application.explorerId}`);
  }

  return {
    version: Number(application.version ?? 0),
    tripId: String(application.tripId),
    explorerId: explorerUid,
    createdAt: toTimestamp(application.createdAt),
    status: String(application.status),
    comments: application.comments ? String(application.comments) : undefined,
    rejectionReason: application.rejectionReason ? String(application.rejectionReason) : undefined,
  };
};

const toReviewPayload = (review, legacyToUid) => {
  const explorerUid = legacyToUid.get(review.explorerId);
  if (!explorerUid) {
    throw new Error(`Explorer UID not found for legacy id: ${review.explorerId}`);
  }

  return {
    version: Number(review.version ?? 0),
    tripId: String(review.tripId),
    explorerId: explorerUid,
    rating: Number(review.rating),
    comment: review.comment ? String(review.comment) : undefined,
    createdAt: toTimestamp(review.createdAt),
  };
};

const toFavouritePayload = (favourite, legacyToUid) => {
  const explorerUid = legacyToUid.get(favourite.explorerId);
  if (!explorerUid) {
    throw new Error(`Explorer UID not found for legacy id: ${favourite.explorerId}`);
  }

  return {
    version: Number(favourite.version ?? 0),
    explorerId: explorerUid,
    name: String(favourite.name),
    tripIds: Array.isArray(favourite.tripIds) ? favourite.tripIds.map(String) : [],
  };
};

const loadSeedData = async () => {
  const raw = await readFile(seedFilePath, 'utf-8');
  return JSON.parse(raw);
};

const loadFirebaseConfig = async () => {
  const raw = await readFile(firebaseConfigPath, 'utf-8');
  return JSON.parse(raw);
};

const getActorUidByEmail = async (db) => {
  const snapshot = await getDocs(collection(db, 'actors'));
  const map = new Map();

  for (const actorDoc of snapshot.docs) {
    const data = actorDoc.data();
    if (typeof data.email === 'string') {
      map.set(data.email, actorDoc.id);
    }
  }

  return map;
};

const buildLegacyToUidMap = (legacyActorsById, actorUidByEmail) => {
  const legacyToUid = new Map();
  const missing = [];

  for (const [legacyId, email] of Object.entries(legacyActorsById)) {
    const uid = actorUidByEmail.get(email);
    if (!uid) {
      missing.push(`${legacyId} -> ${email}`);
      continue;
    }
    legacyToUid.set(legacyId, uid);
  }

  if (missing.length > 0) {
    throw new Error(`Missing actors in Firestore for: ${missing.join(', ')}`);
  }

  return legacyToUid;
};

const writeCollection = async (db, collectionName, items, mapper, legacyToUid) => {
  const batches = [];
  let currentBatch = writeBatch(db);
  let opCount = 0;

  for (const item of items) {
    const itemId = String(item.id);
    const payload = pruneUndefined(mapper(item, legacyToUid));
    const ref = doc(db, collectionName, itemId);
    currentBatch.set(ref, payload, { merge: true });
    opCount += 1;

    if (opCount === 450) {
      batches.push(currentBatch.commit());
      currentBatch = writeBatch(db);
      opCount = 0;
    }
  }

  if (opCount > 0) {
    batches.push(currentBatch.commit());
  }

  await Promise.all(batches);
};

const main = async () => {
  const firebaseConfig = await loadFirebaseConfig();
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Signing in as admin user...');
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

  console.log('Loading seed data...');
  const seedData = await loadSeedData();
  const actorUidByEmail = await getActorUidByEmail(db);
  const legacyToUid = buildLegacyToUidMap(seedData.legacyActorsById, actorUidByEmail);

  console.log('Uploading trips...');
  await writeCollection(db, 'trips', seedData.trips ?? [], toTripPayload, legacyToUid);

  console.log('Uploading applications...');
  await writeCollection(db, 'applications', seedData.applications ?? [], toApplicationPayload, legacyToUid);

  console.log('Uploading reviews...');
  await writeCollection(db, 'reviews', seedData.reviews ?? [], toReviewPayload, legacyToUid);

  console.log('Uploading favourite lists...');
  await writeCollection(db, 'favouriteLists', seedData.favouriteLists ?? [], toFavouritePayload, legacyToUid);

  console.log('Seed completed successfully.');
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
