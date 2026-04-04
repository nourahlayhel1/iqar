import type { Customer, CustomerRequest, Owner, Property } from "@/lib/types";

export const seedProperties: Property[] = [
  {
    id: "0d9812d0-402e-4a2f-91c0-0af4d7e33501",
    title: "Modern Apartment in Beirut Central District",
    description: "Bright apartment with generator access, balcony, and walkable city location.",
    type: "apartment",
    purpose: "rent",
    price: 1500,
    currency: "USD",
    location: {
      country: "Lebanon",
      city: "Beirut",
      area: "Downtown",
      address: "BCD, Beirut"
    },
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 125,
    floor: 6,
    parking: true,
    furnished: true,
    amenities: ["generator", "elevator", "balcony", "parking", "furnished"],
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"],
    ownerId: "a8b1d5ae-6f02-46e7-89df-2fd54132f101",
    ownerName: "Nadim Salem",
    ownerPhone: "+96170000001",
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-02-18T09:00:00.000Z"
  },
  {
    id: "0d9812d0-402e-4a2f-91c0-0af4d7e33502",
    title: "Sea View Villa in Batroun",
    description: "Large villa with garden, pool, and panoramic sea view.",
    type: "villa",
    purpose: "sale",
    price: 650000,
    currency: "USD",
    location: {
      country: "Lebanon",
      city: "Batroun",
      area: "Selaata",
      address: "Coastal Road"
    },
    bedrooms: 5,
    bathrooms: 6,
    areaSqm: 480,
    parking: true,
    furnished: false,
    amenities: ["sea_view", "garden", "pool", "parking", "security"],
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
    ownerId: "a8b1d5ae-6f02-46e7-89df-2fd54132f102",
    ownerName: "Rana Karam",
    ownerPhone: "+96170000002",
    createdAt: "2025-12-20T10:30:00.000Z",
    updatedAt: "2026-02-08T11:15:00.000Z"
  },
  {
    id: "0d9812d0-402e-4a2f-91c0-0af4d7e33503",
    title: "Retail Shop on Main Street",
    description: "Ground floor retail unit in a high foot-traffic commercial strip.",
    type: "shop",
    purpose: "rent",
    price: 2200,
    currency: "USD",
    location: {
      country: "Lebanon",
      city: "Jounieh",
      area: "Kaslik"
    },
    bathrooms: 1,
    areaSqm: 90,
    floor: 0,
    parking: false,
    furnished: false,
    amenities: ["generator", "storage"],
    images: ["https://images.unsplash.com/photo-1497366754035-f200968a6e72"],
    ownerId: "a8b1d5ae-6f02-46e7-89df-2fd54132f103",
    ownerName: "Elie Haddad",
    ownerPhone: "+96170000003",
    createdAt: "2026-02-01T08:15:00.000Z",
    updatedAt: "2026-02-25T13:00:00.000Z"
  }
];

export const seedCustomers: Customer[] = [
  {
    id: "f5e1f3cb-6f22-4c58-aa4d-2be1a1bb1001",
    name: "Maya Khoury",
    phone: "+96171111111",
    altPhone: "+96132222222",
    notes: "Interested in furnished rentals near Beirut.",
    createdAt: "2026-01-10T12:00:00.000Z",
    updatedAt: "2026-02-10T12:00:00.000Z"
  },
  {
    id: "f5e1f3cb-6f22-4c58-aa4d-2be1a1bb1002",
    name: "Omar Harb",
    phone: "+96173333333",
    notes: "Looking for long-term investment opportunities.",
    createdAt: "2026-01-20T14:00:00.000Z",
    updatedAt: "2026-02-16T10:45:00.000Z"
  }
];

export const seedOwners: Owner[] = [
  {
    id: "a8b1d5ae-6f02-46e7-89df-2fd54132f001",
    name: "Ziad Msalem",
    phone: "03 280 100",
    notes: "Owns land listings in Koura.",
    documents: [
      {
        name: "Sale contract",
        url: "https://example.com/contracts/ziad-msalem-sale-contract.pdf"
      }
    ],
    createdAt: "2026-01-12T10:00:00.000Z",
    updatedAt: "2026-01-12T10:00:00.000Z"
  },
  {
    id: "a8b1d5ae-6f02-46e7-89df-2fd54132f101",
    name: "Nadim Salem",
    phone: "+96170000001",
    notes: "Owner of the Beirut Central District apartment.",
    documents: [],
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-02-18T09:00:00.000Z"
  },
  {
    id: "a8b1d5ae-6f02-46e7-89df-2fd54132f102",
    name: "Rana Karam",
    phone: "+96170000002",
    notes: "Owner of the Batroun sea view villa.",
    documents: [],
    createdAt: "2025-12-20T10:30:00.000Z",
    updatedAt: "2026-02-08T11:15:00.000Z"
  },
  {
    id: "a8b1d5ae-6f02-46e7-89df-2fd54132f103",
    name: "Elie Haddad",
    phone: "+96170000003",
    notes: "Owner of the Kaslik retail shop.",
    documents: [],
    createdAt: "2026-02-01T08:15:00.000Z",
    updatedAt: "2026-02-25T13:00:00.000Z"
  }
];

export const seedRequests: CustomerRequest[] = [
  {
    id: "bc77ff39-4b1b-48fd-a43b-e29db5d70001",
    customerId: "f5e1f3cb-6f22-4c58-aa4d-2be1a1bb1001",
    requestType: "apartment",
    purpose: "rent",
    preferredLocations: [{ city: "Beirut", area: "Downtown" }],
    minPrice: 1000,
    maxPrice: 1800,
    minBedrooms: 2,
    minBathrooms: 2,
    minAreaSqm: 100,
    mustHaveAmenities: ["generator", "furnished"],
    notes: "Must be close to work and ready to move in.",
    createdAt: "2026-02-01T09:30:00.000Z",
    updatedAt: "2026-02-18T09:30:00.000Z"
  },
  {
    id: "bc77ff39-4b1b-48fd-a43b-e29db5d70002",
    customerId: "f5e1f3cb-6f22-4c58-aa4d-2be1a1bb1002",
    requestType: "villa",
    purpose: "sale",
    preferredLocations: [{ city: "Batroun" }],
    minPrice: 300000,
    maxPrice: 800000,
    minBedrooms: 4,
    mustHaveAmenities: ["sea_view", "parking"],
    notes: "Prefers coastal areas.",
    createdAt: "2026-02-05T08:00:00.000Z",
    updatedAt: "2026-02-19T08:00:00.000Z"
  }
];
