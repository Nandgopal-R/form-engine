// This file must be imported AFTER setup.ts so mocks are in place
import { resetAllMocks, setAuthenticatedUser } from "./setup";

// Import app AFTER mocks are registered
const { app } = await import("./app");

export { app, resetAllMocks, setAuthenticatedUser };
export {
  jsonBody,
  mockFetch,
  OTHER_USER,
  prismaMock,
  request,
  TEST_USER,
} from "./setup";
