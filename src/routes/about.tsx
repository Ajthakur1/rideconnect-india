import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About RideConnect" },
      {
        name: "description",
        content:
          "RideConnect connects travellers with local taxi and rental operators in Indore, Ujjain, Dewas, Bhopal and Sehore.",
      },
    ],
  }),
});

function About() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">About RideConnect</h1>
      <p className="mt-4 text-muted-foreground">
        RideConnect helps you find and book taxis, outstation cars, airport
        transfers and rental vehicles from local operators in Indore, Ujjain,
        Dewas, Bhopal and Sehore.
      </p>
      <h2 className="mt-8 text-xl font-semibold">What we do</h2>
      <p className="mt-2 text-muted-foreground">
        We bring local taxi owners, fleet operators and travel agencies onto
        one platform so you can compare vehicles, see the estimated fare and
        send a booking request in a few taps.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Own a vehicle or fleet?</h2>
      <p className="mt-2 text-muted-foreground">
        List your vehicles and receive booking requests from travellers in your
        city.
      </p>
      <Link
        to="/become-a-seller"
        className="mt-4 inline-block rounded-md bg-primary px-5 py-2 text-primary-foreground"
      >
        Become a seller
      </Link>
    </main>
  );
}
