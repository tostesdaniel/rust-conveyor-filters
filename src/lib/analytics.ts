import ReactGA from "react-ga4";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (measurementId) {
    ReactGA.initialize(measurementId);
  }
};

export const logEvent = (category: string, action: string, label?: string) => {
  if (measurementId) {
    ReactGA.event({
      category,
      action,
      label,
    });
  }
};
