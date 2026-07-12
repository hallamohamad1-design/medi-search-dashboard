export const environment = {
  production: false,
  // Empty string = same origin. The Angular dev-server proxy forwards /api/* to Flask.
  // If you run the frontend without `ng serve` (e.g. standalone build),
  // set this to 'http://localhost:5000'.
  apiUrl: '',
};
