// This file must be imported AFTER setup.ts so mocks are in place
import { resetAllMocks, setAuthenticatedUser } from "./setup";

// Import app AFTER mocks are registered
const { app } = await import("./app");

export { app, resetAllMocks, setAuthenticatedUser };
export {
  enableFetchMock,
  jsonBody,
  mockFetch,
  OTHER_USER,
  prismaMock,
  request,
  restoreFetch,
  TEST_USER,
} from "./setup";
