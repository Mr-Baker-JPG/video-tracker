import { redirect } from 'react-router'
import { Link } from 'react-router'
import { type Route } from './+types/index.ts'
import { getUserId } from '#app/utils/auth.server.ts'

export const meta: Route.MetaFunction = () => [
	{ title: 'Videotrack – Physics Video Analysis for Classrooms' },
	{
		name: 'description',
		content:
			'Videotrack turns everyday videos into high-quality motion data. Upload, track, and visualize real experiments without manual frame counting or complex software.',
	},
]

export async function loader({ request }: Route.LoaderArgs) {
	// If user is logged in, redirect to videos
	const userId = await getUserId(request)
	if (userId) {
		throw redirect('/videos')
	}
	return {}
}

export default function Index() {
	return (
		<div className="flex min-h-screen flex-col">
			{/* NAVBAR */}
			<header className="bg-muted/80 sticky top-0 z-40 border-b backdrop-blur">
				<nav className="container flex h-16 items-center justify-between gap-4">
					{/* Brand */}
					<Link to="/" className="flex items-center gap-2">
						<img
							src="/img/phystrack-logo.png"
							alt="PhysTrack"
							className="h-8 w-8"
						/>
						<span className="text-h6 tracking-tight">PhysTrack</span>
					</Link>

					{/* Desktop nav links */}
					<div className="text-body-sm text-muted-foreground hidden items-center gap-8 md:flex">
						<a
							href="#how-it-works"
							className="hover:text-foreground transition-colors"
						>
							How it works
						</a>
						<a
							href="#features"
							className="hover:text-foreground transition-colors"
						>
							Features
						</a>
						<a
							href="#pricing"
							className="hover:text-foreground transition-colors"
						>
							Pricing
						</a>
						<a href="#faq" className="hover:text-foreground transition-colors">
							FAQ
						</a>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-3">
						<Link
							to="/login"
							className="text-body-sm text-muted-foreground hover:text-foreground hidden md:inline-block"
						>
							Log in
						</Link>
						<Link
							to="/signup"
							className="bg-primary text-button text-primary-foreground hover:bg-primary-hover inline-flex items-center justify-center rounded-lg px-4 py-2 shadow-sm transition-colors"
						>
							Get started free
						</Link>
					</div>
				</nav>
			</header>

			{/* MAIN CONTENT */}
			<main className="flex-1">
				{/* HERO */}
				<section className="from-muted to-background border-b bg-gradient-to-b">
					<div className="container flex flex-col items-center gap-12 py-16 md:flex-row md:py-20">
						{/* Left: copy */}
						<div className="flex-1 space-y-6">
							<span className="bg-accent text-body-2xs text-accent-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 shadow-xs">
								<span className="bg-success inline-block h-2 w-2 rounded-full"></span>
								Built for physics classrooms
							</span>

							<h1 className="text-h1 tracking-tight">
								Analyze motion from any video.
								<span className="text-primary block">In seconds.</span>
							</h1>

							<p className="text-body-md text-muted-foreground max-w-2xl">
								Videotrack turns everyday videos into high-quality motion data.
								Upload, track, and visualize real experiments without manual
								frame counting or complex software.
							</p>

							<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
								<Link
									to="/signup"
									className="bg-warm-accent text-button text-warm-accent-foreground hover:bg-warm-accent-hover inline-flex items-center justify-center rounded-lg px-6 py-3 shadow-md transition-colors"
								>
									Get started free
								</Link>
								<button
									type="button"
									className="border-border bg-card text-button text-foreground hover:bg-secondary hover:text-secondary-foreground inline-flex items-center justify-center rounded-lg border px-5 py-3 shadow-sm transition-colors"
								>
									<span className="bg-player-bg text-player-fg mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px]">
										▶
									</span>
									Watch 2-minute demo
								</button>
							</div>

							<p className="text-body-2xs text-muted-foreground">
								No installs • Works on Chromebooks • Perfect for high school
								&amp; college labs
							</p>
						</div>

						{/* Right: video/animation placeholder */}
						<div className="flex-1">
							<div className="bg-card ring-border relative mx-auto max-w-xl overflow-hidden rounded-xl shadow-xl ring-1">
								{/* Video/Animation Placeholder */}
								<div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
									<div className="space-y-4 p-8 text-center">
										<div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
											<span className="text-2xl">📹</span>
										</div>
										<div className="space-y-2">
											<p className="text-body-sm text-foreground font-semibold">
												Video/Animation Placeholder
											</p>
											<p className="text-body-xs text-muted-foreground mx-auto max-w-xs">
												This will show a looped video or GIF demonstrating the
												graph drawing in real-time
											</p>
										</div>
									</div>
									{/* Subtle animated overlay hint */}
									<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* LOGO STRIP */}
				<section className="bg-background border-b">
					<div className="container flex flex-col items-center gap-4 py-8 text-center">
						<p className="text-body-xs text-muted-foreground">
							Used in physics and STEM classrooms across the country
						</p>
						<div className="text-body-xs text-muted-foreground flex flex-wrap items-center justify-center gap-8">
							<span className="tracking-wide uppercase">Saint Mary's Prep</span>
							<span className="tracking-wide uppercase">
								Central STEM Academy
							</span>
							<span className="tracking-wide uppercase">Lakeside HS</span>
							<span className="tracking-wide uppercase">
								North Valley College
							</span>
						</div>
					</div>
				</section>

				{/* HOW IT WORKS */}
				<section id="how-it-works" className="bg-background border-b">
					<div className="container py-16">
						<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
							<div>
								<h2 className="text-h2 tracking-tight">How Videotrack works</h2>
								<p className="text-body-sm text-muted-foreground mt-3 max-w-xl">
									A simple four-step flow that turns raw video into ready-to-use
									data for lab reports and classroom discussion.
								</p>
							</div>
							<p className="text-body-xs text-muted-foreground">
								From first upload to export in under five minutes.
							</p>
						</div>

						<div className="mt-10 grid gap-8 lg:grid-cols-2">
							{/* Left Column: Scrollable Steps */}
							<div className="space-y-8">
								{/* Step 1 */}
								<div className="bg-card ring-border rounded-xl p-6 shadow-sm ring-1">
									<div className="flex items-start gap-4">
										<span className="bg-primary/10 text-primary inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold">
											1
										</span>
										<div className="flex-1">
											<h3 className="text-body-md font-semibold">
												Upload a video
											</h3>
											<p className="text-body-xs text-muted-foreground mt-2">
												Drag and drop, choose a file, or paste a YouTube URL
												from any lab, demo, or everyday motion.
											</p>
										</div>
									</div>
								</div>

								{/* Step 2 */}
								<div className="bg-card ring-border rounded-xl p-6 shadow-sm ring-1">
									<div className="flex items-start gap-4">
										<span className="bg-primary/10 text-primary inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold">
											2
										</span>
										<div className="flex-1">
											<h3 className="text-body-md font-semibold">
												Set the scale
											</h3>
											<p className="text-body-xs text-muted-foreground mt-2">
												Mark a known distance—a meter stick, a desk edge, or a
												track segment—to calibrate real-world units.
											</p>
										</div>
									</div>
								</div>

								{/* Step 3 */}
								<div className="bg-card ring-border rounded-xl p-6 shadow-sm ring-1">
									<div className="flex items-start gap-4">
										<span className="bg-primary/10 text-primary inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold">
											3
										</span>
										<div className="flex-1">
											<h3 className="text-body-md font-semibold">
												Track the object
											</h3>
											<p className="text-body-xs text-muted-foreground mt-2">
												Click points frame-by-frame or enable assisted tracking.
												Track collisions, springs, projectiles, and more.
											</p>
										</div>
									</div>
								</div>

								{/* Step 4 */}
								<div className="bg-card ring-border rounded-xl p-6 shadow-sm ring-1">
									<div className="flex items-start gap-4">
										<span className="bg-primary/10 text-primary inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold">
											4
										</span>
										<div className="flex-1">
											<h3 className="text-body-md font-semibold">
												Generate graphs &amp; exports
											</h3>
											<p className="text-body-xs text-muted-foreground mt-2">
												Instantly visualize position, velocity, and
												acceleration, then export PNG graphs or CSV data for lab
												reports.
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Right Column: Sticky Container */}
							<div className="lg:sticky lg:top-20 lg:self-start">
								<div className="bg-muted/60 ring-border flex min-h-[400px] items-center justify-center rounded-xl p-8 shadow-sm ring-1">
									<div className="space-y-4 text-center">
										<div className="bg-primary/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
											<span className="text-3xl">📊</span>
										</div>
										<div className="space-y-2">
											<p className="text-body-sm text-foreground font-semibold">
												Dynamic Image Placeholder
											</p>
											<p className="text-body-xs text-muted-foreground mx-auto max-w-xs">
												This sticky container will show dynamic images that
												change based on the active step as you scroll
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* FEATURES */}
				<section id="features" className="bg-muted/40 border-b">
					<div className="container py-16">
						<div className="max-w-2xl">
							<h2 className="text-h2 tracking-tight">
								Designed for real classrooms
							</h2>
							<p className="text-body-sm text-muted-foreground mt-3">
								Videotrack focuses on clarity, speed, and student understanding
								so you can spend less time wrestling software and more time
								discussing physics.
							</p>
						</div>

						<div className="mt-10 grid gap-6 md:grid-cols-3">
							{/* Feature cards */}
							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/15 text-primary inline-flex h-12 w-12 items-center justify-center rounded-full text-xl">
									📈
								</span>
								<h3 className="text-body-md mt-4 leading-tight font-semibold">
									Instant graphs
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2 leading-snug">
									Generate position, velocity, and acceleration plots on the
									fly. Toggle axes, zoom, and export for reports.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/15 text-primary inline-flex h-12 w-12 items-center justify-center rounded-full text-xl">
									🧪
								</span>
								<h3 className="text-body-md mt-4 leading-tight font-semibold">
									Multi-experiment library
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2 leading-snug">
									Keep all your lab videos and analyses organized by class,
									topic, or unit—ready to revisit next semester.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/15 text-primary inline-flex h-12 w-12 items-center justify-center rounded-full text-xl">
									💻
								</span>
								<h3 className="text-body-md mt-4 leading-tight font-semibold">
									Browser-based
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2 leading-snug">
									Works on Chromebooks, Macs, and PCs. No installs, no admin
									permissions—just open and start tracking.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/15 text-primary inline-flex h-12 w-12 items-center justify-center rounded-full text-xl">
									👩‍🏫
								</span>
								<h3 className="text-body-md mt-4 leading-tight font-semibold">
									Teacher-first controls
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2 leading-snug">
									Lock key settings, share starter files, and scaffold data
									collection so students focus on reasoning, not setup.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/15 text-primary inline-flex h-12 w-12 items-center justify-center rounded-full text-xl">
									📤
								</span>
								<h3 className="text-body-md mt-4 leading-tight font-semibold">
									Export everywhere
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2 leading-snug">
									Download PNG graphs and CSV data that drop directly into
									Google Docs, Sheets, or lab notebooks.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/15 text-primary inline-flex h-12 w-12 items-center justify-center rounded-full text-xl">
									🌐
								</span>
								<h3 className="text-body-md mt-4 leading-tight font-semibold">
									Accessible by design
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2 leading-snug">
									Clear contrast, keyboard navigation, and screen-reader
									friendly controls support all learners.
								</p>
							</article>
						</div>
					</div>
				</section>

				{/* TEACHERS / STUDENTS VALUE */}
				<section className="bg-background border-b">
					<div className="container grid gap-10 py-16 md:grid-cols-2">
						{/* Teachers */}
						<div className="bg-card ring-border rounded-2xl p-8 shadow-md ring-1">
							<p className="text-body-2xs text-primary font-semibold tracking-wide uppercase">
								For teachers
							</p>
							<h3 className="text-h3 mt-3 tracking-tight">
								Less setup, more discussion.
							</h3>
							<p className="text-body-sm text-muted-foreground mt-3">
								Replace tedious manual tracking with fast, visual tools. Spend
								class time interpreting graphs, building models, and connecting
								motion to concepts.
							</p>
							<ul className="text-body-xs text-muted-foreground mt-5 space-y-2">
								<li>• Prep a complete motion lab in minutes.</li>
								<li>• Reuse the same experiment across multiple sections.</li>
								<li>
									• Quickly pull up past analyses for review or assessment.
								</li>
							</ul>
						</div>

						{/* Students */}
						<div className="bg-card ring-border rounded-2xl p-8 shadow-md ring-1">
							<p className="text-body-2xs text-primary font-semibold tracking-wide uppercase">
								For students
							</p>
							<h3 className="text-h3 mt-3 tracking-tight">
								See physics happen in real time.
							</h3>
							<p className="text-body-sm text-muted-foreground mt-3">
								Students can track their own experiments, visualize curves as
								they work, and connect algebraic functions to actual motion.
							</p>
							<ul className="text-body-xs text-muted-foreground mt-5 space-y-2">
								<li>• Immediate feedback on tracking accuracy.</li>
								<li>• Clear visual link between graphs and real movement.</li>
								<li>• Data your students can argue about—in the best way.</li>
							</ul>
						</div>
					</div>
				</section>

				{/* TESTIMONIALS */}
				<section className="bg-muted/50 border-b">
					<div className="container py-16">
						<div className="max-w-2xl">
							<h2 className="text-h2 tracking-tight">
								What educators are saying
							</h2>
							<p className="text-body-sm text-muted-foreground mt-3">
								Videotrack is already helping teachers turn everyday experiments
								into rigorous, engaging labs.
							</p>
						</div>

						<div className="mt-10 grid gap-6 md:grid-cols-3">
							<article className="bg-card ring-border flex h-full flex-col rounded-xl p-6 shadow-sm ring-1">
								<p className="text-body-xs text-muted-foreground">
									"My students finally see velocity and acceleration as more
									than symbols. The graphs feel connected to what they watched
									happen on screen."
								</p>
								<div className="mt-4 flex items-center gap-3">
									{/* Avatar placeholder */}
									<div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
										<span className="text-body-xs text-primary font-semibold">
											LM
										</span>
									</div>
									<div className="min-w-0 flex-1">
										<div className="text-body-2xs font-semibold">
											<p>Dr. L. Martinez</p>
											<p className="text-muted-foreground font-normal">
												AP Physics, Central STEM Academy
											</p>
										</div>
									</div>
									{/* School logo placeholder */}
									<div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded">
										<span className="text-muted-foreground text-[10px]">
											CSA
										</span>
									</div>
								</div>
							</article>

							<article className="bg-card ring-border flex h-full flex-col rounded-xl p-6 shadow-sm ring-1">
								<p className="text-body-xs text-muted-foreground">
									"Videotrack saved me hours of prep each week. I can reuse
									experiments, share them with colleagues, and keep the focus on
									sense-making."
								</p>
								<div className="mt-4 flex items-center gap-3">
									{/* Avatar placeholder */}
									<div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
										<span className="text-body-xs text-primary font-semibold">
											JP
										</span>
									</div>
									<div className="min-w-0 flex-1">
										<div className="text-body-2xs font-semibold">
											<p>J. Patel</p>
											<p className="text-muted-foreground font-normal">
												Physics Teacher, Lakeside HS
											</p>
										</div>
									</div>
									{/* School logo placeholder */}
									<div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded">
										<span className="text-muted-foreground text-[10px]">
											LHS
										</span>
									</div>
								</div>
							</article>

							<article className="bg-card ring-border flex h-full flex-col rounded-xl p-6 shadow-sm ring-1">
								<p className="text-body-xs text-muted-foreground">
									"Students love bringing in their own videos—from skateboards
									to basketball shots—and turning them into real data."
								</p>
								<div className="mt-4 flex items-center gap-3">
									{/* Avatar placeholder */}
									<div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
										<span className="text-body-xs text-primary font-semibold">
											MR
										</span>
									</div>
									<div className="min-w-0 flex-1">
										<div className="text-body-2xs font-semibold">
											<p>M. Reed</p>
											<p className="text-muted-foreground font-normal">
												Intro Physics, North Valley College
											</p>
										</div>
									</div>
									{/* School logo placeholder */}
									<div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded">
										<span className="text-muted-foreground text-[10px]">
											NVC
										</span>
									</div>
								</div>
							</article>
						</div>
					</div>
				</section>

				{/* PRICING */}
				<section id="pricing" className="bg-background border-b">
					<div className="container py-16">
						<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
							<div>
								<h2 className="text-h2 tracking-tight">
									Simple pricing for schools
								</h2>
								<p className="text-body-sm text-muted-foreground mt-3 max-w-xl">
									Start free and upgrade when you're ready to roll Videotrack
									out to your full course or department.
								</p>
							</div>
							<p className="text-body-xs text-muted-foreground">
								Annual plans available for districts and multi-site programs.
							</p>
						</div>

						<div className="mt-10 grid gap-6 md:grid-cols-3">
							{/* Free */}
							<div className="bg-card ring-border flex flex-col rounded-2xl p-6 shadow-md ring-1">
								<p className="text-body-2xs text-muted-foreground font-semibold tracking-wide uppercase">
									Starter
								</p>
								<h3 className="text-body-lg mt-2 font-semibold">Free</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Ideal for trying Videotrack in a few labs or with a single
									class.
								</p>
								<ul className="text-body-xs text-muted-foreground mt-4 space-y-2">
									<li>• Up to 5 saved experiments</li>
									<li>• Basic tracking &amp; charts</li>
									<li>• PNG graph export</li>
								</ul>
								<Link
									to="/signup"
									className="border-border bg-muted text-button text-foreground hover:bg-secondary hover:text-secondary-foreground mt-6 inline-flex items-center justify-center rounded-lg border px-4 py-2 transition-colors"
								>
									Get started
								</Link>
							</div>

							{/* Teacher Pro */}
							<div className="bg-card ring-primary relative flex flex-col rounded-2xl p-6 shadow-xl ring-2">
								<div className="bg-warm-accent text-warm-accent-foreground absolute -top-3 right-4 rounded-full px-3 py-1 text-[10px] font-semibold shadow-xs">
									Most popular
								</div>
								<p className="text-body-2xs text-primary font-semibold tracking-wide uppercase">
									Teacher Pro
								</p>
								<h3 className="text-body-lg mt-2 font-semibold">$12 / month</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									For teachers running motion analysis regularly across multiple
									sections.
								</p>
								<ul className="text-body-xs text-muted-foreground mt-4 space-y-2">
									<li>• Unlimited experiments &amp; uploads</li>
									<li>• Multi-object tracking &amp; advanced charts</li>
									<li>• CSV export for spreadsheets</li>
									<li>• Priority educator support</li>
								</ul>
								<Link
									to="/signup"
									className="bg-warm-accent text-button text-warm-accent-foreground hover:bg-warm-accent-hover mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 shadow-md transition-colors"
								>
									Upgrade to Pro
								</Link>
							</div>

							{/* School / District */}
							<div className="bg-card ring-border flex flex-col rounded-2xl p-6 shadow-md ring-1">
								<p className="text-body-2xs text-muted-foreground font-semibold tracking-wide uppercase">
									School / District
								</p>
								<h3 className="text-body-lg mt-2 font-semibold">Custom</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Department-wide deployments, shared libraries, and onboarding
									support for teams.
								</p>
								<ul className="text-body-xs text-muted-foreground mt-4 space-y-2">
									<li>• Multi-teacher &amp; multi-school licensing</li>
									<li>• Admin controls &amp; shared experiments</li>
									<li>• Training and onboarding sessions</li>
								</ul>
								<Link
									to="/contact"
									className="border-border bg-muted text-button text-foreground hover:bg-secondary hover:text-secondary-foreground mt-6 inline-flex items-center justify-center rounded-lg border px-4 py-2 transition-colors"
								>
									Talk to sales
								</Link>
							</div>
						</div>
					</div>
				</section>

				{/* FAQ */}
				<section id="faq" className="bg-muted/40 border-b">
					<div className="container py-16">
						<div className="max-w-2xl">
							<h2 className="text-h2 tracking-tight">
								Frequently asked questions
							</h2>
							<p className="text-body-sm text-muted-foreground mt-3">
								A few quick answers. If you need anything else, you can always
								reach out.
							</p>
						</div>

						<div className="mt-8 space-y-3">
							<details className="group bg-card ring-border rounded-lg p-4 shadow-xs ring-1">
								<summary className="text-body-sm flex cursor-pointer items-center justify-between font-medium">
									<span>What kinds of videos work with Videotrack?</span>
									<span className="text-muted-foreground ml-4 transition-transform group-open:rotate-90">
										›
									</span>
								</summary>
								<p className="text-body-xs text-muted-foreground mt-2">
									Any reasonably clear video that shows the motion you care
									about—from lab setups to phone recordings of carts, balls,
									pendulums, or projectiles. MP4, WebM, MOV, and YouTube links
									are all supported.
								</p>
							</details>

							<details className="group bg-card ring-border rounded-lg p-4 shadow-xs ring-1">
								<summary className="text-body-sm flex cursor-pointer items-center justify-between font-medium">
									<span>Do students need accounts to use it?</span>
									<span className="text-muted-foreground ml-4 transition-transform group-open:rotate-90">
										›
									</span>
								</summary>
								<p className="text-body-xs text-muted-foreground mt-2">
									Teachers can project, screen-share, or run analyses and share
									exported data. Student accounts are optional; they help when
									you want each group to manage its own experiments.
								</p>
							</details>

							<details className="group bg-card ring-border rounded-lg p-4 shadow-xs ring-1">
								<summary className="text-body-sm flex cursor-pointer items-center justify-between font-medium">
									<span>Does it run on Chromebooks?</span>
									<span className="text-muted-foreground ml-4 transition-transform group-open:rotate-90">
										›
									</span>
								</summary>
								<p className="text-body-xs text-muted-foreground mt-2">
									Yes. Videotrack is fully browser-based and works on
									Chromebooks, Macs, and Windows devices with a modern browser.
								</p>
							</details>

							<details className="group bg-card ring-border rounded-lg p-4 shadow-xs ring-1">
								<summary className="text-body-sm flex cursor-pointer items-center justify-between font-medium">
									<span>How accurate is the tracking?</span>
									<span className="text-muted-foreground ml-4 transition-transform group-open:rotate-90">
										›
									</span>
								</summary>
								<p className="text-body-xs text-muted-foreground mt-2">
									Accuracy depends on video quality and calibration. With a
									stable camera and clear scale reference, Videotrack delivers
									classroom-ready data suitable for modeling and quantitative
									lab work.
								</p>
							</details>
						</div>
					</div>
				</section>

				{/* FINAL CTA */}
				<section className="from-primary/10 via-accent/40 to-primary/10 bg-gradient-to-r">
					<div className="container flex flex-col items-center justify-between gap-6 py-14 text-center md:flex-row md:text-left">
						<div>
							<h2 className="text-h2 tracking-tight">
								Bring motion analysis to life.
							</h2>
							<p className="text-body-sm text-muted-foreground mt-3 max-w-xl">
								Start with a single experiment or roll Videotrack out to your
								entire course. Your next lab can be running in minutes.
							</p>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row">
							<Link
								to="/signup"
								className="bg-primary text-button text-primary-foreground hover:bg-primary-hover inline-flex items-center justify-center rounded-lg px-6 py-3 shadow-md transition-colors"
							>
								Start free
							</Link>
							<Link
								to="/demo"
								className="border-border bg-card text-button text-foreground hover:bg-secondary hover:text-secondary-foreground inline-flex items-center justify-center rounded-lg border px-6 py-3 transition-colors"
							>
								Schedule a demo
							</Link>
						</div>
					</div>
				</section>
			</main>

			{/* FOOTER */}
			<footer className="bg-background border-t">
				<div className="text-body-2xs text-muted-foreground container flex flex-col items-center justify-between gap-4 py-6 text-center md:flex-row md:text-left">
					<p>© 2025 Videotrack Analysis Tool · v1.1.0</p>
					<div className="flex flex-wrap items-center gap-4">
						<Link
							to="/help"
							className="hover:text-foreground transition-colors"
						>
							Help Center
						</Link>
						<Link
							to="/privacy"
							className="hover:text-foreground transition-colors"
						>
							Privacy
						</Link>
						<Link
							to="/terms"
							className="hover:text-foreground transition-colors"
						>
							Terms
						</Link>
					</div>
				</div>
			</footer>
		</div>
	)
}
