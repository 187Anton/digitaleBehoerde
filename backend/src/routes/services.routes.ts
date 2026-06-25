import { Router } from "express";
export const servicesRouter = Router();
const services = [
  {
    type: "RESIDENCE_CHANGE",
    title: "Wohnsitz ummelden",
    description: "Adresswechsel innerhalb Deutschlands online anzeigen.",
    available: true,
  },
  {
    type: "DOG_TAX",
    title: "Hundesteuer anmelden",
    description: "Halter- und Hundedaten erfassen und Steuer anmelden.",
    available: true,
  },
  {
    type: "CERTIFICATE_OF_CONDUCT",
    title: "Fuehrungszeugnis beantragen",
    description: "Behoerdliches Fuehrungszeugnis online beantragen.",
    available: true,
  },
];
servicesRouter.get("/", (_req, res) => {
  res.json({ services });
});
