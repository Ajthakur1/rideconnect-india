# Ride Connect India

Build a production-quality, mobile-first two-sided marketplace website for taxi, chauffeur-driven car, and car rental bookings.

The platform connects:

CUSTOMERS — people who want to book a taxi/car.

SELLERS — vehicle owners, taxi operators, travel agencies, and drivers who receive and fulfill bookings.

ADMIN — the platform owner who manages the entire marketplace and earns commission from bookings.

IMPORTANT:
Do not build this as a static landing page. Build a functional full-stack MVP with authentication, database integration, role-based dashboards, booking workflow, seller vehicle management, and commission tracking.

Use:

React

TypeScript

Tailwind CSS

Supabase for authentication, PostgreSQL database, and storage

Responsive/mobile-first design

Clean REST/database architecture

Environment variables for secrets

No hardcoded passwords or API keys

BRAND:
Use the temporary brand name “RideConnect”.
Design should look like a modern Indian mobility marketplace: clean, trustworthy, premium but affordable.
Use a professional navigation bar and strong CTA buttons.
The website must work well on mobile because many customers will book using smartphones.

==================================================




USER ROLES

Create three roles:

CUSTOMER
SELLER
ADMIN

Use role-based access control so users cannot access another role’s dashboard.

==================================================




DATABASE

Create these Supabase/PostgreSQL tables.

users

id

name

phone

email

role

profile_image

status

created_at

updated_at

Roles:
customer
seller
admin

seller_profiles

id

user_id

business_name

owner_name

phone

email

city

address

verification_status

commission_rate

status

created_at

updated_at

Default commission_rate = 10%.

vehicles

id

seller_id

vehicle_type

brand

model

registration_number

year

seats

fuel_type

transmission

air_conditioned

images

description

local_price

outstation_price_per_km

airport_price

rental_price_per_day

status

created_at

updated_at

Vehicle types:
Sedan
SUV
Hatchback
Luxury
Tempo Traveller
Other

drivers

id

seller_id

name

phone

license_number

status

verification_status

created_at

updated_at

bookings

id

booking_number

customer_id

seller_id

vehicle_id

driver_id

booking_type

pickup_location

drop_location

pickup_date

pickup_time

passengers

trip_distance

estimated_fare

final_fare

commission_rate

commission_amount

seller_amount

payment_status

booking_status

customer_notes

seller_notes

created_at

updated_at

Booking types:
local
outstation
airport
rental

Booking statuses:
pending
seller_notified
seller_accepted
seller_rejected
confirmed
driver_assigned
trip_started
trip_completed
cancelled
payment_completed

booking_requests

id

booking_id

seller_id

response_status

responded_at

created_at

Response statuses:
pending
accepted
rejected
expired

payments

id

booking_id

customer_id

amount

payment_method

transaction_id

payment_status

paid_at

created_at

Payment methods:
cash
upi
card
online

commissions

id

booking_id

seller_id

booking_amount

commission_rate

commission_amount

settlement_status

settled_at

created_at

vehicle_availability

id

vehicle_id

date

status

booking_id

created_at

Statuses:
available
blocked
booked

reviews

id

booking_id

customer_id

seller_id

vehicle_id

rating

review_text

created_at

==================================================




CUSTOMER WEBSITE

Create these pages:

HOME
SEARCH
VEHICLE DETAILS
BOOKING
BOOKING CONFIRMATION
MY BOOKINGS
PROFILE
LOGIN
REGISTER

HOME PAGE:

Hero section:

“Book Your Ride. Your Way.”

Subtitle:
“Compare trusted local taxis, rental cars and travel vehicles from verified local operators.”

Search widget:

Trip Type:
Local
Outstation
Airport
Rental

Pickup Location
Drop Location
Date
Time
Passengers

CTA:
“Search Vehicles”

Add category cards:

Taxi
Outstation
Airport Transfer
Car Rental
SUV
Tempo Traveller
Luxury Cars

Add sections:

How It Works
Why RideConnect
Featured Vehicles
Verified Sellers
Customer Reviews
Become a Seller

==================================================




CUSTOMER SEARCH

When the customer searches:

Display matching vehicles.

Each vehicle card should show:

Vehicle image
Vehicle type
Brand/model
Seats
AC
Fuel
Seller name
Seller verification badge
Price
Rating
“View Details”
“Book Now”

Allow filters:

Vehicle type
Seats
Price
AC
Transmission
Rating
Seller verification
Location

Allow sorting:

Price low to high
Price high to low
Rating
Recommended

==================================================




VEHICLE DETAILS

Show:

Large vehicle images
Vehicle information
Seller information
Rating
Pricing
Available services
Cancellation information
Book Now button

Do not expose sensitive seller information before a confirmed booking.

==================================================




BOOKING FLOW

Customer selects:

Vehicle
Pickup location
Drop location
Date
Time
Passengers
Trip type
Additional notes

Calculate estimated fare.

Before confirmation show:

Estimated total
Platform/service fee if applicable
Final estimated customer payment
Cancellation policy

Create booking after customer confirmation.

Generate unique booking number such as:

RC-2026-000001

==================================================




SELLER DASHBOARD

Create:

Dashboard
My Vehicles
Add Vehicle
Bookings
Booking Requests
Drivers
Availability
Earnings
Profile
Verification

Dashboard statistics:

Today’s bookings
Pending requests
Completed trips
Total earnings
Platform commission
Upcoming trips

SELLER VEHICLE MANAGEMENT:

Seller can:

Add vehicle
Upload multiple images
Edit vehicle
Set pricing
Set availability
Deactivate vehicle

BOOKING REQUEST:

Show:

Booking number
Customer first name
Pickup
Drop
Date
Time
Passengers
Vehicle
Estimated fare
Commission
Seller earnings

Buttons:

ACCEPT
REJECT

When seller accepts:

Update booking status to seller_accepted/confirmed according to workflow.

When seller rejects:

Mark request rejected and allow the system to offer the booking to another eligible seller.

==================================================




ADMIN DASHBOARD

Create a secure admin dashboard.

Sections:

Overview
Customers
Sellers
Vehicles
Bookings
Payments
Commissions
Reviews
Reports
Settings

Dashboard statistics:

Total customers
Total sellers
Verified sellers
Total vehicles
Today’s bookings
Completed bookings
Cancelled bookings
Gross booking value
Total commission
Pending seller settlements

ADMIN CAN:

Approve/reject sellers
Verify sellers
Approve/reject vehicles
Suspend users
View bookings
Change booking status
View payments
View commissions
Manage commission percentage
View reports
Manage categories

==================================================




COMMISSION SYSTEM

Default commission:

10%

Example:

Customer booking value = ₹2,000

Commission = 10%

Platform commission = ₹200

Seller amount = ₹1,800

Store these values separately in the bookings and commissions tables.

Commission formula:

commission_amount =
final_fare × commission_rate / 100

seller_amount =
final_fare - commission_amount

Do not allow sellers to modify their own commission rate.

Only ADMIN can change commission rates.

==================================================




BOOKING DISPATCH LOGIC

When a customer creates a booking:

Create booking with status = pending.

Find eligible active/verified sellers.

Check vehicle availability.

Create booking_requests for eligible sellers.

Notify sellers.

First eligible seller who accepts gets the booking.

Mark other pending requests as expired/rejected.

Update booking to confirmed.

Notify customer.

For Version 1, seller notification can initially appear inside the seller dashboard.

Design the architecture so WhatsApp/SMS/email notifications can be added later.

==================================================




SECURITY

Implement Supabase Row Level Security.

Customers can:

View their own profile.

Create bookings.

View their own bookings.

Create reviews for completed bookings.

Sellers can:

View/edit their own seller profile.

Manage their own vehicles.

Manage their own drivers.

View booking requests assigned to them.

View their own completed bookings and earnings.

Sellers must NOT be able to:

View another seller’s private information.

Modify another seller’s vehicles.

Modify platform commission.

Access admin data.

Admins can manage all marketplace records.

Never expose passwords or secret API keys.

==================================================




MOBILE DESIGN

The entire website must be responsive.

Prioritize mobile.

Use:

Bottom navigation where appropriate

Large touch-friendly buttons

Simple booking forms

Cards instead of wide tables on mobile

Fast-loading images

Clean typography

==================================================




DEMO DATA

Create sample data for development:

5 customers
5 sellers
10 vehicles
5 drivers
10 sample bookings
Several reviews

Use realistic Indian data but clearly mark it as demo/test data.

Example locations:

Indore
Ujjain
Dewas
Bhopal
Sehore

Example vehicles:

Maruti Dzire
Maruti Ertiga
Toyota Innova
Kia Carens
Maruti Baleno
Tempo Traveller

==================================================




ADMIN REPORTING

Create simple reports:

Daily bookings
Monthly bookings
Gross booking value
Commission earned
Completed trips
Cancelled trips
Seller earnings

Add date filters.

==================================================




IMPORTANT VERSION 1 LIMITATIONS

Do NOT build:

Live GPS tracking
Complex driver navigation
Automatic surge pricing
Wallet system
Subscription system
Native Android/iOS apps
Complex payment gateway integration

Keep the architecture ready for these features later.

For now, focus on making the core marketplace workflow actually work.

==================================================




FINAL TEST

After implementation, test this complete workflow:

Customer registers.

Seller registers.

Admin verifies seller.

Seller adds Dzire.

Customer searches Indore → Ujjain.

Customer sees Dzire.

Customer creates booking.

Seller receives booking request.

Seller accepts.

Booking becomes confirmed.

Commission is calculated automatically.

Seller sees earnings.

Customer sees booking in My Bookings.

Admin sees booking and commission.

Fix any errors discovered during this test.

Do not merely create mock buttons or fake data for the core workflow. The customer, seller and admin workflows must be connected to the actual database.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rideconnect-india.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/aba7390e-ad6b-5b6b-8137-2664dc489888).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
