import { NextResponse } from "./http";
import { DomainError } from "./db";

export function handleApiError(err: unknown) {
  if (err instanceof DomainError) {
    return NextResponse.json(
      {
        error: {
          code: err.code,
          message: err.message,
        },
      },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : "Unexpected server error";
  return NextResponse.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        message,
      },
    },
    { status: 400 }
  );
}

