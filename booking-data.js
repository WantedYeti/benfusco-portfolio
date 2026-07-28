window.BK_SETTINGS = {
  businessName: 'Ben Fusco Media',
  businessEmail: 'contact@benfusco.com',
  timezone: 'America/Toronto',
  timezoneLabel: 'Eastern Time',
  responseWindow: '24–48 hours',
  formEndpoint: 'https://formspree.io/f/mqaylyqj',
  serviceArea: 'Ottawa, Gatineau, Aylmer & surrounding areas',
  requestAcknowledgementVersion: 'BFM-REQUEST-2026-07-27-5'
};

/*
 * Draft service standards used in the request workflow. These are business
 * defaults, not a substitute for the final client-specific agreement. Keep
 * the values centralized here so the website, quote and final agreement can
 * be updated together after legal review.
 */
window.BK_SERVICE_STANDARDS = {
  realEstate: {
    photoDelivery: 'The 50 final listing images—including interior, exterior and drone photos plus one basic 2D floor plan—are targeted within 2 business days after the shoot.',
    videoDelivery: 'Walkthrough and drone video edits are targeted within 3 business days after the shoot.',
    tourDelivery: 'A 360° virtual tour is targeted within 3 business days after a successful property capture.',
    deliveryMethod: 'Delivery is through a private download link. Photos are supplied in high-resolution and MLS/web-ready JPEG formats; floor plans as PDF and JPEG; video as MP4; and a 360° tour as a hosted link.',
    revisions: 'One round of reasonable minor corrections is included when requested within 5 calendar days of delivery. Reshoots, changed staging, item removal, virtual renovation and changes outside the confirmed scope are quoted separately.',
    rawFiles: 'RAW, unedited and project-source files are not included or delivered.',
    archive: 'Delivered photo, video and floor-plan files are retained for 90 days after delivery as a courtesy and are not guaranteed after that period. Clients must download and back up their files.',
    tourHosting: 'Premium 360 includes 90 days of hosting beginning on the delivery date. Additional 90-day periods are available for CA$25 each when requested before expiry. Hosting depends on the third-party platform remaining available.',
    travel: 'The first 50 km of round-trip travel within the Ottawa–Gatineau service area is included. Additional round-trip kilometres are quoted at CA$0.70 per kilometre. Parking, tolls and special access costs are disclosed and approved before confirmation.',
    payment: 'Standard real-estate requests do not require a retainer. An invoice is issued when the media is ready. Payment is due before unwatermarked, full-resolution deliverables are released. Approved brokerage accounts may receive Net 7 terms. The listing-media licence begins after full payment.',
    cancellation: 'Cancellation requested at least 48 hours before the appointment has no cancellation fee. With 24–48 hours notice, one reschedule is available without an administrative fee, subject to availability.',
    lateCancellation: 'For a business client, a cancellation with less than 24 hours notice, a no-show, or unavailable property access may carry a CA$75 fee only when that term appears in the accepted final agreement. Consumer clients are charged only amounts permitted by the applicable agreement and mandatory law, such as reasonable documented work or non-recoverable expenses.',
    weatherReschedule: 'Weather, unsafe or unlawful drone conditions, illness, emergency, or another condition outside reasonable control may be rescheduled without a cancellation fee. If Ben Fusco Media cannot provide the confirmed service, the client receives the remedy stated in the final agreement and any refund required by law.',
    licence: 'After full payment, the named client, the named listing brokerage, the property seller and the applicable MLS and listing-syndication services receive a non-exclusive licence to use the delivered media solely to market the specific property during the current listing.',
    licenceEnd: 'The standard listing licence ends when the property is sold, withdrawn, the listing expires, or the original agent or brokerage no longer holds the listing. Re-listing, transfer to another agent, builder, stager, architect, publication or unrelated advertising requires written permission or a separate licence.',
    portfolio: 'Ben Fusco Media portfolio and social-media use is a separate choice and is not required to request or purchase services.',
    drone: 'Drone media is captured with a DJI Mini 4 Pro configured with the standard battery at an operating weight below 250 g. Coverage remains subject to weather, visibility, airspace, privacy, access, equipment configuration, safety and applicable Transport Canada requirements.'
  }
};

window.BK_PACKAGES = {
  mini: {
    id: 'mini', category: 'portrait', group: 'portrait', service: 'Portrait Photography', code: 'POR 01',
    title: 'Mini Session', description: 'A short, guided session for seasonal portraits or a quick refresh.',
    duration: '15 minutes', price: 125, deposit: 50, currency: 'CA$', contractType: 'portrait',
    location: 'Gatineau, Ottawa & surrounding areas',
    image: 'Images/Desktop/Portraits/Gabriella/IMG_1773-Edit-Edit-Edit.jpg',
    includes: ['15-minute guided session', '10 edited high-resolution images', 'Private online gallery', 'Personal-use image licence'],
    slots: { Morning: ['9:00 AM', '10:00 AM', '11:00 AM'], Afternoon: ['1:00 PM', '2:00 PM', '3:00 PM'] }
  },
  midi: {
    id: 'midi', category: 'portrait', group: 'portrait', service: 'Portrait Photography', code: 'POR 02',
    title: 'Midi Session', description: 'A balanced session for couples, families, personal branding, or one planned outfit change.',
    duration: '30 minutes', price: 175, deposit: 75, currency: 'CA$', contractType: 'portrait',
    location: 'Gatineau, Ottawa & surrounding areas',
    image: 'Images/Desktop/Portraits/Jordan/2M2A5383-Enhanced-NR.jpg',
    includes: ['30-minute guided session', 'Up to 25 edited high-resolution images', 'Private online gallery', 'Personal-use image licence'],
    slots: { Morning: ['9:30 AM', '10:30 AM', '11:30 AM'], Afternoon: ['1:30 PM', '2:30 PM', '3:30 PM'] }
  },
  maxi: {
    id: 'maxi', category: 'portrait', group: 'portrait', service: 'Portrait Photography', code: 'POR 03',
    title: 'Maxi Session', description: 'A complete portrait experience with time for multiple looks, groupings, or nearby locations.',
    duration: '60 minutes', price: 225, deposit: 100, currency: 'CA$', contractType: 'portrait',
    location: 'Gatineau, Ottawa & surrounding areas',
    image: 'Images/Desktop/Portraits/Maggie/IMG_7872-Edit.jpg',
    includes: ['60-minute guided session', '40–50 edited high-resolution images', 'Private online gallery', 'Personal-use image licence'],
    slots: { Morning: ['9:00 AM', '10:30 AM'], Afternoon: ['1:00 PM', '2:30 PM', '4:00 PM'] }
  },
  'real-estate-photos': {
    id: 'real-estate-photos', category: 'real-estate', group: 'real-estate', service: 'Real Estate Media', code: 'RE 01',
    title: 'Listing Essentials', description: 'Professional listing photography, aerial perspectives, and a floor plan for properties up to 2,500 sq. ft.',
    duration: '1–2 hours', price: 350, deposit: 0, currency: 'CA$', contractType: 'real-estate',
    location: 'Ottawa, Gatineau, Aylmer & surrounding areas',
    image: 'Images/Brand/real-estate-media.svg',
    includes: ['50 final listing images total, including interior, exterior, drone photos, and one basic 2D floor plan', 'Approximately 5–10 of the 50 images may be drone photos, weather and airspace permitting', 'High-resolution and web-ready delivery', 'Photo and floor-plan delivery targeted within 2 business days'],
    slots: { Morning: ['9:00 AM – 11:00 AM'], Afternoon: ['11:30 AM – 1:30 PM', '2:00 PM – 4:00 PM'] }
  },
  'real-estate-standard': {
    id: 'real-estate-standard', category: 'real-estate', group: 'real-estate', service: 'Real Estate Media', code: 'RE 02',
    title: 'Complete Listing Package', description: 'Photography, drone coverage, video, and a floor plan for properties up to 2,500 sq. ft.',
    duration: '2–3 hours', price: 550, deposit: 0, currency: 'CA$', contractType: 'real-estate',
    location: 'Ottawa, Gatineau, Aylmer & surrounding areas',
    image: 'Images/Brand/real-estate-media.svg',
    includes: ['50 final listing images total, including interior, exterior, drone photos, and one basic 2D floor plan', 'Approximately 5–10 of the 50 images may be drone photos, weather and airspace permitting', 'One vertical or horizontal property walkthrough video', 'Drone video footage, weather and airspace permitting', 'Licensed music', 'High-resolution and web-ready delivery'],
    slots: { Morning: ['9:00 AM – 12:00 PM'], Afternoon: ['12:30 PM – 3:30 PM'], Evening: ['4:00 PM – 7:00 PM'] }
  },
  'real-estate-premium': {
    id: 'real-estate-premium', category: 'real-estate', group: 'real-estate', service: 'Real Estate Media', code: 'RE 03',
    title: 'Premium 360 Package', description: 'Everything in Complete Listing plus an interactive 360° virtual property tour with 90 days of hosting.',
    duration: '2–3 hours', price: 695, deposit: 0, currency: 'CA$', contractType: 'real-estate',
    location: 'Ottawa, Gatineau, Aylmer & surrounding areas',
    image: 'Images/Brand/real-estate-media.svg',
    includes: ['50 final listing images total, including interior, exterior, drone photos, and one basic 2D floor plan', 'Approximately 5–10 of the 50 images may be drone photos, weather and airspace permitting', 'One vertical or horizontal property walkthrough video', 'Drone video footage, weather and airspace permitting', 'Interactive 360° virtual property tour', '90 days of virtual-tour hosting', 'High-resolution and web-ready delivery'],
    slots: { Morning: ['9:00 AM – 12:00 PM'], Afternoon: ['12:30 PM – 3:30 PM'], Evening: ['4:00 PM – 7:00 PM'] }
  },
  'wedding-inquiry': {
    id: 'wedding-inquiry', category: 'inquiry', group: 'wedding', service: 'Wedding Photography & Video', code: 'WED 01',
    title: 'Wedding Coverage', description: 'Comprehensive photography coverage shaped around your wedding timeline, with video and second-photographer options available.',
    duration: '6–10 hours', price: null, priceLabel: 'Starting at CA$1,850', deposit: 0, currency: 'CA$', contractType: 'inquiry',
    location: 'Ottawa, Gatineau & available for travel',
    image: 'Images/Desktop/Weddings/Max%20and%20Taylor/25-2M2A4878.jpg',
    includes: ['6–10 hours of tailored coverage', 'High-resolution, fully edited images', 'Private online gallery delivery', 'Video and second-photographer options'],
    slots: { Preferred: ['Morning', 'Afternoon', 'Evening'] }
  },
  'business-social': {
    id: 'business-social', category: 'inquiry', group: 'business', service: 'Business & Social Content', code: 'BIZ 01',
    title: 'Business & Social Content', description: 'Photo and video content planned around your brand, campaign, and publishing needs.',
    duration: 'Custom session', price: null, priceLabel: 'Custom Quote', deposit: 0, currency: 'CA$', contractType: 'inquiry',
    location: 'Ottawa, Gatineau & surrounding areas',
    image: 'Images/Brand/business-content.svg',
    includes: ['Photo, video, or combined production', 'Platform-ready deliverables', 'Commercial usage discussed in your quote', 'Clear scope and delivery schedule'],
    slots: { Preferred: ['Morning', 'Afternoon', 'Evening'] }
  },
  'events-concerts': {
    id: 'events-concerts', category: 'inquiry', group: 'events', service: 'Events & Concerts', code: 'EVT 01',
    title: 'Events & Concerts', description: 'Professional photo and video coverage for performances, celebrations, launches, and live events.',
    duration: 'Custom coverage', price: null, priceLabel: 'Custom Quote', deposit: 0, currency: 'CA$', contractType: 'inquiry',
    location: 'Ottawa, Gatineau & available for travel',
    image: 'Images/Desktop/Concerts/Sepultra/13-2M2A2071-Edit.jpg',
    includes: ['Photo, video, or combined coverage', 'Edited highlight delivery', 'Event-specific usage options', 'Coverage planned around your run of show'],
    slots: { Preferred: ['Morning', 'Afternoon', 'Evening'] }
  },
  'drone-aerial': {
    id: 'drone-aerial', category: 'inquiry', group: 'drone', service: 'Drone & Aerial Media', code: 'DRN 01',
    title: 'Drone & Aerial Media', description: 'Aerial photos and video for properties, businesses, events, and creative projects.',
    duration: 'Custom session', price: null, priceLabel: 'Custom Quote', deposit: 0, currency: 'CA$', contractType: 'inquiry',
    location: 'Ottawa, Gatineau & surrounding areas',
    image: 'Images/Brand/drone-aerial-media.svg',
    includes: ['Aerial photos, video, or both', 'Flight-feasibility review', 'Edited high-resolution delivery', 'Weather-flexible scheduling'],
    slots: { Preferred: ['Morning', 'Afternoon', 'Evening'] }
  },
  'custom-project': {
    id: 'custom-project', category: 'inquiry', group: 'custom', service: 'Custom Creative Project', code: 'CUS 01',
    title: 'Custom Project', description: 'For creative work that does not fit a standard package. Tell me what you have in mind.',
    duration: 'Custom scope', price: null, priceLabel: 'Custom Quote', deposit: 0, currency: 'CA$', contractType: 'inquiry',
    location: 'Ottawa, Gatineau & available for travel',
    image: 'Images/Desktop/Concerts/Sepultra/13-2M2A2071-Edit.jpg',
    includes: ['Project discovery', 'Custom scope and quote', 'Photo, video, editing, or mixed-media options', 'Clear deliverables and schedule'],
    slots: { Preferred: ['Morning', 'Afternoon', 'Evening'] }
  }
};

window.BK_ADDONS = {
  'real-estate': [
    { name: 'Extra social-media reel', description: 'A second short vertical edit for Instagram, Facebook, or TikTok.', priceLabel: 'Custom quote' },
    { name: 'Agent introduction video', description: 'A polished on-camera introduction recorded at the property.', priceLabel: 'Custom quote' },
    { name: 'Twilight photography', description: 'Exterior images captured or finished with an evening look.', priceLabel: 'Custom quote' },
    { name: 'Virtual staging', description: 'Selected empty rooms digitally furnished for marketing.', priceLabel: 'Priced per image' },
    { name: 'Rush delivery', description: 'Priority turnaround when the production schedule allows.', priceLabel: 'By availability' },
    { name: 'Neighbourhood footage', description: 'Nearby amenities and location highlights added to the story.', priceLabel: 'Custom quote' },
    { name: 'Additional floor-plan level', description: 'Coverage for an extra floor, unit, or detached structure.', priceLabel: 'Custom quote' }
  ],
  portrait: ['Additional edited images', 'Advanced retouching', 'Rush delivery']
};
