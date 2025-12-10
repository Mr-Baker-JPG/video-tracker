import { Link } from 'react-router'
import { type Route } from './+types/index.ts'

export const meta: Route.MetaFunction = () => [
	{ title: 'Videotrack – Physics Video Analysis for Classrooms' },
	{
		name: 'description',
		content:
			'Videotrack turns everyday videos into high-quality motion data. Upload, track, and visualize real experiments without manual frame counting or complex software.',
	},
]

export default function Index() {
	return (
		<div className="flex min-h-screen flex-col">
			{/* NAVBAR */}
			<header className="bg-muted/80 sticky top-0 z-40 border-b backdrop-blur">
				<nav className="container flex h-16 items-center justify-between gap-4">
					{/* Brand */}
					<Link to="/" className="flex items-center gap-2">
						<span className="bg-primary text-primary-foreground inline-flex h-8 w-8 items-center justify-center rounded-lg shadow-sm">
							{/* Simple icon: play button in a square */}
							<span className="bg-primary-foreground text-primary inline-flex h-4 w-4 items-center justify-center rounded text-[10px] leading-none font-bold">
								▶
							</span>
						</span>
						<span className="text-h6 tracking-tight">Videotrack</span>
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

							<p className="text-body-md text-muted-foreground max-w-xl">
								Videotrack turns everyday videos into high-quality motion data.
								Upload, track, and visualize real experiments without manual
								frame counting or complex software.
							</p>

							<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
								<Link
									to="/signup"
									className="bg-primary text-button text-primary-foreground hover:bg-primary-hover inline-flex items-center justify-center rounded-lg px-6 py-3 shadow-md transition-colors"
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

						{/* Right: hero mock UI */}
						<div className="flex-1">
							<div className="bg-card ring-border relative mx-auto max-w-xl rounded-xl shadow-xl ring-1">
								{/* Top bar */}
								<div className="border-border flex items-center justify-between border-b px-4 py-3">
									<div className="flex items-center gap-1.5">
										<span className="bg-destructive/80 h-2.5 w-2.5 rounded-full"></span>
										<span className="bg-warning/80 h-2.5 w-2.5 rounded-full"></span>
										<span className="bg-success/80 h-2.5 w-2.5 rounded-full"></span>
									</div>
									<div className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-[11px] font-medium">
										Pendulum.mp4 · 62 frames
									</div>
									<div className="text-muted-foreground text-[11px]">
										Demo preview
									</div>
								</div>

								{/* Video + controls */}
								<div className="border-border grid gap-0 border-b md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
									{/* Video area */}
									<div className="bg-player-bg/90 relative px-4 pt-3 pb-4">
										<div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black/60">
											{/* Fake video frame */}
											<div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
												{/* Scale badge */}
												<div className="bg-success/90 text-player-fg absolute top-3 left-3 rounded-full px-2 py-1 text-[10px] font-medium shadow-xs">
													Scale: 0.20 m
												</div>

												{/* Tracking dots / path */}
												<div className="absolute inset-x-[48%] top-6 bottom-10 flex flex-col items-center justify-between">
													{/* Dots */}
													<div className="bg-data-position/60 h-10 w-0.5 rounded-full"></div>
													<div className="bg-data-velocity/60 h-10 w-0.5 rounded-full"></div>
													<div className="bg-data-acceleration/60 h-10 w-0.5 rounded-full"></div>
												</div>

												{/* Origin axes */}
												<div className="bg-player-progress-bg/60 absolute inset-x-4 bottom-10 h-px"></div>
												<div className="bg-player-progress-bg/60 absolute bottom-10 left-1/2 h-12 w-px -translate-x-1/2"></div>

												{/* Tracking label */}
												<div className="bg-muted/90 text-muted-foreground absolute top-3 right-3 rounded-full px-2 py-1 text-[10px] font-medium">
													Tracking: bobber
												</div>
											</div>
										</div>

										{/* Playback controls */}
										<div className="mt-3 space-y-2">
											<div className="bg-player-progress-bg/40 h-1.5 w-full rounded-full">
												<div className="bg-primary h-1.5 w-1/3 rounded-full"></div>
											</div>
											<div className="text-player-fg/80 flex items-center justify-between text-[11px]">
												<span>00:18 / 02:10</span>
												<span>Frame 21 of 62</span>
											</div>
											<div className="mt-2 flex items-center justify-center gap-3">
												<button
													type="button"
													className="bg-muted text-muted-foreground hover:bg-secondary inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-colors"
												>
													⏮
												</button>
												<button
													type="button"
													className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-9 w-9 items-center justify-center rounded-full text-[13px] shadow-md transition-colors"
												>
													▶
												</button>
												<button
													type="button"
													className="bg-muted text-muted-foreground hover:bg-secondary inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-colors"
												>
													⏭
												</button>
											</div>
										</div>
									</div>

									{/* Metrics / table */}
									<div className="border-border bg-muted/60 flex flex-col border-t p-4 md:border-t-0 md:border-l">
										{/* Metrics */}
										<div className="grid grid-cols-2 gap-3">
											<div className="bg-card rounded-lg p-3 shadow-xs">
												<p className="text-body-2xs text-muted-foreground">
													Total distance
												</p>
												<p className="text-body-lg mt-1 font-semibold">
													1.72 m
												</p>
											</div>
											<div className="bg-card rounded-lg p-3 shadow-xs">
												<p className="text-body-2xs text-muted-foreground">
													Average velocity
												</p>
												<p className="text-body-lg text-data-velocity mt-1 font-semibold">
													1.56 m/s
												</p>
											</div>
											<div className="bg-card rounded-lg p-3 shadow-xs">
												<p className="text-body-2xs text-muted-foreground">
													Max velocity
												</p>
												<p className="text-body-lg mt-1 font-semibold">
													3.57 m/s
												</p>
											</div>
											<div className="bg-card rounded-lg p-3 shadow-xs">
												<p className="text-body-2xs text-muted-foreground">
													Acceleration
												</p>
												<p className="text-body-lg text-data-acceleration mt-1 font-semibold">
													24.31 m/s²
												</p>
											</div>
										</div>

										{/* Table preview */}
										<div className="bg-card mt-4 flex-1 rounded-lg p-3 shadow-xs">
											<div className="text-muted-foreground flex items-center justify-between text-[11px]">
												<span>Frame data</span>
												<span>62 pts</span>
											</div>
											<div className="text-muted-foreground mt-2 space-y-1 font-mono text-[10px]">
												<div className="flex justify-between">
													<span className="w-1/4"># 0</span>
													<span className="w-1/4 text-right">t=0.00 s</span>
													<span className="w-1/4 text-right">x=0.07 m</span>
													<span className="w-1/4 text-right">y=-0.01 m</span>
												</div>
												<div className="flex justify-between">
													<span className="w-1/4"># 1</span>
													<span className="w-1/4 text-right">t=0.03 s</span>
													<span className="w-1/4 text-right">x=0.09 m</span>
													<span className="w-1/4 text-right">y=0.01 m</span>
												</div>
												<div className="flex justify-between">
													<span className="w-1/4"># 2</span>
													<span className="w-1/4 text-right">t=0.07 s</span>
													<span className="w-1/4 text-right">x=0.15 m</span>
													<span className="w-1/4 text-right">y=0.08 m</span>
												</div>
												<div className="text-data-select flex justify-between">
													<span className="w-1/4"># 3</span>
													<span className="w-1/4 text-right">t=0.10 s</span>
													<span className="w-1/4 text-right">x=0.18 m</span>
													<span className="w-1/4 text-right">y=0.11 m</span>
												</div>
											</div>
											<button
												type="button"
												className="bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground mt-3 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-[11px] font-medium transition-colors"
											>
												Export CSV
											</button>
										</div>
									</div>
								</div>

								{/* Chart preview */}
								<div className="grid gap-4 p-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
									<div className="bg-muted rounded-lg p-4">
										<div className="text-muted-foreground flex items-center justify-between text-[11px]">
											<span>Position vs. Time</span>
											<span>bobber · x-axis</span>
										</div>
										<div className="border-border bg-card mt-3 h-32 rounded border border-dashed">
											{/* Simple chart line */}
											<svg viewBox="0 0 100 40" className="h-full w-full">
												<polyline
													points="0,30 10,29 20,27 30,24 40,20 50,15 60,11 70,8 80,6 90,5 100,5"
													fill="none"
													stroke="var(--chart-2)"
													strokeWidth="1.5"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</div>
									</div>
									<div className="bg-muted space-y-3 rounded-lg p-4">
										<p className="text-body-xs text-muted-foreground font-semibold">
											Try it in your next lab
										</p>
										<p className="text-body-xs text-muted-foreground">
											Upload a video of a pendulum, a cart on a track, or a ball
											toss and walk students through real-time data collection,
											graphing, and modeling.
										</p>
										<Link
											to="/signup"
											className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex items-center justify-center rounded-md px-3 py-2 text-[11px] font-semibold shadow-sm transition-colors"
										>
											Launch Videotrack
										</Link>
									</div>
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

						<div className="mt-10 grid gap-6 md:grid-cols-4">
							{/* Step 1 */}
							<div className="bg-card ring-border rounded-xl p-5 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold">
									1
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Upload a video
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Drag and drop, choose a file, or paste a YouTube URL from any
									lab, demo, or everyday motion.
								</p>
							</div>

							{/* Step 2 */}
							<div className="bg-card ring-border rounded-xl p-5 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold">
									2
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Set the scale
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Mark a known distance—a meter stick, a desk edge, or a track
									segment—to calibrate real-world units.
								</p>
							</div>

							{/* Step 3 */}
							<div className="bg-card ring-border rounded-xl p-5 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold">
									3
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Track the object
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Click points frame-by-frame or enable assisted tracking. Track
									collisions, springs, projectiles, and more.
								</p>
							</div>

							{/* Step 4 */}
							<div className="bg-card ring-border rounded-xl p-5 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold">
									4
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Generate graphs &amp; exports
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Instantly visualize position, velocity, and acceleration, then
									export PNG graphs or CSV data for lab reports.
								</p>
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
								<span className="bg-primary/10 text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg text-[16px]">
									📈
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Instant graphs
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Generate position, velocity, and acceleration plots on the
									fly. Toggle axes, zoom, and export for reports.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg text-[16px]">
									🧪
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Multi-experiment library
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Keep all your lab videos and analyses organized by class,
									topic, or unit—ready to revisit next semester.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg text-[16px]">
									💻
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Browser-based
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Works on Chromebooks, Macs, and PCs. No installs, no admin
									permissions—just open and start tracking.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg text-[16px]">
									👩‍🏫
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Teacher-first controls
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Lock key settings, share starter files, and scaffold data
									collection so students focus on reasoning, not setup.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg text-[16px]">
									📤
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Export everywhere
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
									Download PNG graphs and CSV data that drop directly into
									Google Docs, Sheets, or lab notebooks.
								</p>
							</article>

							<article className="bg-card ring-border flex flex-col rounded-xl p-6 shadow-sm ring-1">
								<span className="bg-primary/10 text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg text-[16px]">
									🌐
								</span>
								<h3 className="text-body-md mt-4 font-semibold">
									Accessible by design
								</h3>
								<p className="text-body-xs text-muted-foreground mt-2">
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
								<div className="text-body-2xs mt-4 font-semibold">
									<p>Dr. L. Martinez</p>
									<p className="text-muted-foreground">
										AP Physics, Central STEM Academy
									</p>
								</div>
							</article>

							<article className="bg-card ring-border flex h-full flex-col rounded-xl p-6 shadow-sm ring-1">
								<p className="text-body-xs text-muted-foreground">
									"Videotrack saved me hours of prep each week. I can reuse
									experiments, share them with colleagues, and keep the focus on
									sense-making."
								</p>
								<div className="text-body-2xs mt-4 font-semibold">
									<p>J. Patel</p>
									<p className="text-muted-foreground">
										Physics Teacher, Lakeside HS
									</p>
								</div>
							</article>

							<article className="bg-card ring-border flex h-full flex-col rounded-xl p-6 shadow-sm ring-1">
								<p className="text-body-xs text-muted-foreground">
									"Students love bringing in their own videos—from skateboards
									to basketball shots—and turning them into real data."
								</p>
								<div className="text-body-2xs mt-4 font-semibold">
									<p>M. Reed</p>
									<p className="text-muted-foreground">
										Intro Physics, North Valley College
									</p>
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
								<div className="bg-primary text-primary-foreground absolute -top-3 right-4 rounded-full px-3 py-1 text-[10px] font-semibold shadow-xs">
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
									className="bg-primary text-button text-primary-foreground hover:bg-primary-hover mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 shadow-md transition-colors"
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
