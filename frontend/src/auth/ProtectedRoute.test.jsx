import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "./ProtectedRoute";

let authState;

vi.mock("./AuthContext", () => ({
  useAuth: () => authState,
}));

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route
          path="/private"
          element={<ProtectedRoute><div>Private content</div></ProtectedRoute>}
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    authState = { user: null, loading: false };
  });

  it("does not reveal protected content while Firebase initializes", () => {
    authState = { user: null, loading: true };
    renderRoute();

    expect(screen.getByText("Loading your fashion vault...")).toBeInTheDocument();
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  });

  it("redirects logged-out visitors", () => {
    renderRoute();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders protected content for an authenticated user", () => {
    authState = { user: { uid: "user-1" }, loading: false };
    renderRoute();
    expect(screen.getByText("Private content")).toBeInTheDocument();
  });
});
