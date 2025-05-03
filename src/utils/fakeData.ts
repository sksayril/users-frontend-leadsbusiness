import { faker } from '@faker-js/faker';
import { LeadPreview, PurchasedLead } from '../services/leadsService';

// Generate fake lead previews
export const generateFakeLeadPreviews = (count: number, categoryId: string, categoryName: string): LeadPreview[] => {
  return Array.from({ length: count }, (_, index) => ({
    _id: faker.string.uuid(),
    customerName: faker.person.fullName(),
    price: faker.number.int({ min: 1, max: 50 }),
    category: {
      _id: categoryId,
      name: categoryName
    }
  }));
};

// Generate fake purchased lead data
export const generateFakePurchasedLead = (leadId: string, categoryId: string, categoryName: string): PurchasedLead => {
  return {
    id: leadId,
    customerName: faker.person.fullName(),
    customerAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
    customerContact: faker.phone.number(),
    customerEmail: faker.internet.email(),
    category: {
      _id: categoryId,
      name: categoryName
    },
    purchaseDate: faker.date.recent().toISOString()
  };
}; 