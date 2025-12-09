import { Img } from 'openimg/react'
import { useRef } from 'react'
import { Link, Form } from 'react-router'
import { ThemeSwitch } from '#app/routes/resources/theme-switch.tsx'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { useUser } from '#app/utils/user.ts'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuPortal,
	DropdownMenuContent,
	DropdownMenuItem,
} from './ui/dropdown-menu'
import { Icon } from './ui/icon'

export function UserDropdown() {
	const user = useUser()
	const formRef = useRef<HTMLFormElement>(null)

	// Get user initials for avatar
	const getInitials = (name: string | null | undefined, username: string) => {
		if (name) {
			const parts = name.trim().split(/\s+/)
			if (parts.length >= 2) {
				return (
					(parts[0]?.charAt(0) ?? '') +
					(parts[parts.length - 1]?.charAt(0) ?? '').toUpperCase()
				)
			}
			return name[0]?.toUpperCase() || username[0]?.toUpperCase() || 'U'
		}
		return username[0]?.toUpperCase() || 'U'
	}

	const initials = getInitials(user.name, user.username)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="text-primary flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-semibold transition-colors hover:bg-blue-100"
					aria-label="User menu"
				>
					{user.image?.objectKey ? (
						<Img
							className="size-9 rounded-full object-cover"
							alt={user.name ?? user.username}
							src={getUserImgSrc(user.image.objectKey)}
							width={36}
							height={36}
							aria-hidden="true"
						/>
					) : (
						<span>{initials}</span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent sideOffset={8} align="end">
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}`}>
							<Icon className="text-body-md" name="avatar">
								Profile
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}/notes`}>
							<Icon className="text-body-md" name="pencil-2">
								Notes
							</Icon>
						</Link>
					</DropdownMenuItem>
					<Form action="/logout" method="POST" ref={formRef}>
						<DropdownMenuItem asChild>
							<button type="submit" className="w-full">
								<Icon className="text-body-md" name="exit">
									Logout
								</Icon>
							</button>
						</DropdownMenuItem>
					</Form>
					{/* Add theme switcher */}
					<DropdownMenuItem asChild>
						<ThemeSwitch asDropdownItem={true} />
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}
