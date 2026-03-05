import { FullWidthDivider } from "@/components/ui/full-width-divider";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

export function NotFoundPage() {
	return (
		<div className="flex w-full items-center justify-center overflow-hidden">
			<div className="flex h-screen items-center border-x">
				<div>
					<FullWidthDivider />
					<Empty>
						<EmptyHeader>
							<EmptyTitle className="font-black font-mono text-8xl">
								404
							</EmptyTitle>
							<EmptyDescription className="text-nowrap">
								The page you're looking for might have been <br />
								moved or doesn't exist.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<div className="flex gap-2">
								<Button asChild>
									<a href="#">
										<IconPlaceholder
											data-icon="inline-start"
											hugeicons="Home01Icon"
											lucide="HomeIcon"
											phosphor="HouseIcon"
											remixicon="RiHomeLine"
											tabler="IconHome"
										/>
										Go Home
									</a>
								</Button>

								<Button asChild variant="outline">
									<a href="#">
										<IconPlaceholder
											data-icon="inline-start"
											hugeicons="CompassIcon"
											lucide="CompassIcon"
											phosphor="CompassIcon"
											remixicon="RiCompassLine"
											tabler="IconCompass"
										/>
										Explore
									</a>
								</Button>
							</div>
						</EmptyContent>
					</Empty>
					<FullWidthDivider />
				</div>
			</div>
		</div>
	);
}
