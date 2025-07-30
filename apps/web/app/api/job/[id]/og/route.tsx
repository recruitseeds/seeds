import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getServerTRPCCaller } from "@/trpc/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = params.id;

    // Parse options from query params
    const includeTitle = searchParams.get("title") !== "false";
    const includeCompany = searchParams.get("company") === "true";
    const includeSalary = searchParams.get("salary") === "true";
    const includeLocation = searchParams.get("location") === "true";
    const template = searchParams.get("template") || "modern";

    // Fetch job data using your tRPC setup
    const caller = await getServerTRPCCaller();
    const job = await caller.organization.getJobPosting({ id: jobId });

    if (!job) {
      return new Response("Job not found", { status: 404 });
    }

    // Define template styles
    const templateStyles = {
      modern: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        primaryColor: "#ffffff",
        secondaryColor: "#f1f5f9",
        accentColor: "#cbd5e1",
      },
      minimal: {
        background: "#ffffff",
        primaryColor: "#1f2937",
        secondaryColor: "#6b7280",
        accentColor: "#059669",
      },
      corporate: {
        background: "#1e40af",
        primaryColor: "#ffffff",
        secondaryColor: "#f1f5f9",
        accentColor: "#34d399",
      },
    };

    const style =
      templateStyles[template as keyof typeof templateStyles] ||
      templateStyles.modern;

    // Format salary for display
    const formatSalary = () => {
      if (job.salary_min && job.salary_max) {
        return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
      }
      return null;
    };

    const salaryDisplay = formatSalary();

    return new ImageResponse(
      (
        <div
          style={{
            background: style.background,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "60px",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: "relative",
          }}
        >
          {/* Main content container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              maxWidth: "1000px",
              zIndex: 1,
            }}
          >
            {/* Job Title */}
            {includeTitle && (
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  color: style.primaryColor,
                  marginBottom: 24,
                  lineHeight: 1.1,
                  textAlign: "center",
                  letterSpacing: "-0.02em",
                }}
              >
                {job.title}
              </div>
            )}

            {/* Company Name */}
            {includeCompany && (
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 500,
                  color: style.secondaryColor,
                  marginBottom: 20,
                }}
              >
                {/* You might want to get company name from organization data */}
                Your Company Name
              </div>
            )}

            {/* Location and Salary Container */}
            <div
              style={{
                display: "flex",
                gap: "40px",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              {/* Location */}
              {includeLocation && (
                <div
                  style={{
                    fontSize: 28,
                    color: style.accentColor,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontWeight: 500,
                  }}
                >
                  <div style={{ fontSize: 24 }}>📍</div>
                  Remote {/* You can make this dynamic based on job data */}
                </div>
              )}

              {/* Salary */}
              {includeSalary && salaryDisplay && (
                <div
                  style={{
                    fontSize: 28,
                    color: style.accentColor,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{ fontSize: 24 }}>💰</div>
                  {salaryDisplay}
                </div>
              )}
            </div>

            {/* Job Type Badge */}
            {job.job_type && (
              <div
                style={{
                  marginTop: 32,
                  padding: "12px 24px",
                  backgroundColor:
                    template === "minimal"
                      ? "#f3f4f6"
                      : "rgba(255, 255, 255, 0.2)",
                  borderRadius: "25px",
                  fontSize: 20,
                  fontWeight: 500,
                  color: template === "minimal" ? "#1f2937" : "#ffffff",
                  textTransform: "capitalize",
                }}
              >
                {job.job_type.replace("_", " ")}
              </div>
            )}
          </div>

          {/* Branding Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              right: 60,
              fontSize: 18,
              color: style.accentColor,
              opacity: 0.8,
              fontWeight: 500,
            }}
          >
            seeds-ats.com
          </div>

          {/* Decorative Elements for Modern Template */}
          {template === "modern" && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "200px",
                  height: "200px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "300px",
                  height: "300px",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "50%",
                  transform: "translate(50%, 50%)",
                }}
              />
            </>
          )}

          {/* Grid Pattern for Corporate Template */}
          {template === "corporate" && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0.1,
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
            />
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
        // Enable debugging to see what's happening
        debug: false,
      },
    );
  } catch (e: any) {
    console.error("OG Image generation error:", e.message);
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}
