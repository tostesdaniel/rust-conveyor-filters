import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPHttpJsonTraceExporter, registerOTel } from "@vercel/otel";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

export function register() {
  registerOTel({
    serviceName: "rcf-frontend",
    traceExporter: new OTLPHttpJsonTraceExporter({
      url: "http://localhost:4318/v1/traces",
    }),
  });
}
