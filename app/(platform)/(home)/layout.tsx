import { notFound } from "next/navigation"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-current-user"
import NewIssueButton from "@/app/(platform)/(home)/_components/NewIssueButton/NewIssueButton"
import Sidebar from "./_components/Sidebar/Sidebar"
import SidebarMobile from "./_components/Sidebar/SidebarMobile"
import MobileHeader from "./_components/Sidebar/SidebarMobileHeader"
import ProfileDropdown from "./_components/Sidebar/SidebarProfileDropdown"
import SidebarNavigationLinks from "./_components/Sidebar/SidebarNavigationLinks"
import ProjectList from "./_components/Sidebar/SidebarProjectList"

const projectIdAndTitleSelect = {
  id: true,
  title: true,
} satisfies Prisma.ProjectSelect

export type ProjectIdAndTitle = Prisma.ProjectGetPayload<{
  select: typeof projectIdAndTitleSelect
}>

async function getProjects() {
  const project = await prisma.project.findMany({
    select: projectIdAndTitleSelect,
  })

  return project
}

const labelSelect = {
  id: true,
  name: true,
  color: true,
} satisfies Prisma.LabelSelect

export type Labels = Prisma.LabelGetPayload<{
  select: typeof labelSelect
}>

async function getLabels() {
  const labels = await prisma.label.findMany({
    select: labelSelect,
  })

  return labels
}

const usersSelect = {
  id: true,
  name: true,
  image: true,
} satisfies Prisma.UserSelect

export type Users = Prisma.UserGetPayload<{
  select: typeof usersSelect
}>

async function getUsers() {
  const users = await prisma.user.findMany({
    select: usersSelect,
  })

  return users
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return notFound()
  }

  const [profile, users, projects, labels] = await Promise.all([
    currentUser,
    getUsers(),
    getProjects(),
    getLabels(),
  ])
  return (
    <>
      <Sidebar>
        {/* Desktop Layout */}
        <div className="hidden lg:fixed lg:top-16 lg:bottom-0 lg:z-50 lg:flex lg:w-64 lg:flex-col ">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r px-6">
            <ProfileDropdown profile={profile} />
            <NewIssueButton {...{ users, labels, projects }} />
            <nav className="flex flex-1 flex-col">
              <ul className="flex flex-1 flex-col gap-y-7">
                <li>
                  <SidebarNavigationLinks />
                  <div className="text-xs font-semibold leading-6 text-gray-400">
                    Projects
                  </div>
                  <ProjectList projects={projects} />
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Mobile Layout */}
        <SidebarMobile>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <SidebarNavigationLinks />
                <div className="text-xs font-semibold leading-6 text-gray-400">
                  Projects
                </div>
                <ProjectList projects={projects} />
              </li>
            </ul>
          </nav>
        </SidebarMobile>
        <MobileHeader />
      </Sidebar>
        <main className="mx-auto  bg-white lg:pl-64">
          {children}
        </main>
    </>
  )
}