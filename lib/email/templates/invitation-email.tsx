import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	pixelBasedPreset,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface InvitationEmailProps {
	inviterName: string;
	organizationName: string;
	role: string;
	acceptUrl: string;
	expiresAt: string;
	organizationLogo?: string;
}

const companyLogo =
	"https://pub-e05ee10cfc0b40c59cc080c153ad3da0.r2.dev/logo.jpg";

export const InvitationEmail = ({
	inviterName,
	organizationName,
	role,
	acceptUrl,
	expiresAt,
	organizationLogo,
}: InvitationEmailProps) => {
	const roleDisplayName = role
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

	const previewText = `Join ${organizationName} as a ${roleDisplayName}`;

	return (
		<Html>
			<Head />
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
				}}
			>
				<Body className="mx-auto my-auto bg-white px-2 font-sans">
					<Preview>{previewText}</Preview>
					<Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
						<Section className="mt-[32px]">
							<Img
								src={companyLogo}
								width="60"
								height="60"
								alt="Seeds ATS Logo"
								className="mx-auto my-0"
							/>
						</Section>

						<Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
							You're invited to join <strong>{organizationName}</strong>
						</Heading>

						<Text className="text-[14px] text-black leading-[24px]">
							Hello there,
						</Text>

						<Text className="text-[14px] text-black leading-[24px]">
							<strong>{inviterName}</strong> has invited you to join{" "}
							<strong>{organizationName}</strong> as a{" "}
							<strong>{roleDisplayName}</strong>.
						</Text>

						<Text className="text-[14px] text-black leading-[24px]">
							Click the button below to accept your invitation and create your
							account to get started with the team.
						</Text>

						{organizationLogo && (
							<Section className="mt-[32px] mb-[32px] text-center">
								<Img
									className="rounded-lg mx-auto"
									src={organizationLogo}
									width="80"
									height="80"
									alt={`${organizationName} logo`}
								/>
							</Section>
						)}

						<Section className="mt-[32px] mb-[32px] text-center">
							<Button
								className="rounded-lg bg-[#11b1b4] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
								href={acceptUrl}
							>
								Accept Invitation & Join Team
							</Button>
						</Section>

						<Text className="text-[14px] text-black leading-[24px]">
							or copy and paste this URL into your browser:{" "}
							<Link href={acceptUrl} className="text-blue-600 no-underline">
								{acceptUrl}
							</Link>
						</Text>

						<Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />

						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This invitation will expire in{" "}
							<span className="text-black">{expiresAt}</span>. If you did not
							expect this invitation, you can safely ignore this email.
						</Text>

						<Text className="text-[#666666] text-[12px] leading-[24px] text-center mt-[20px]">
							Powered by{" "}
							<Link
								href="https://recruitseeds.com"
								className="text-[#666666] no-underline"
							>
								Seeds
							</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default InvitationEmail;
