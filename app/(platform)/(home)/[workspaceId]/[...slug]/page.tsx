/* eslint-disable @next/next/no-img-element */
import { Divider } from "@/components/catalyst/divider"
import { COLORS } from "@/lib/colors"
import { getCurrentUser } from "@/lib/get-current-user"
import prisma from "@/lib/prisma"
import { classNames } from "@/lib/utils"
import { LockClosedIcon } from "@heroicons/react/24/outline"
import dynamic from "next/dynamic"
import { RedirectType, notFound, redirect } from "next/navigation"
import { Suspense } from "react"
import { ActivityFeed } from "./_components/activity-feed"
import AddLabelButton from "./_components/add-label-button"
import {
  AddComment,
  AssigneeProperty,
  DescriptionField,
  PriorityProperty,
  StatusProperty,
} from "./_components/issue-details"
import { IssueActivityType, getActivities, getIssueByProject } from "./_data/issue"
import { slugify } from "./helpers"

const Editor = dynamic(() => import("@/components/lexical_editor/editor"), {
  ssr: true,
})

export default async function IssuePage({
  params,
}: {
  params: {
    slug: string[]
    workspaceId: string
  }
}) {
  const { slug, workspaceId } = params
  if (slug.length > 3) {
    return notFound()
  }

  const session = await getCurrentUser()
  if (!session) {
    redirect("/login")
  }

  const [, issueCode = "", title] = slug
  const [projectId = "", issueId = ""] = issueCode.split("-")

  const issue = await getIssueByProject(session, projectId, issueId)
  if (!issue) {
    notFound()
  }

  const labels = await prisma.label.findMany()
  const issueLabels = issue.labels

  // Self-healing url
  const issueSlug = slugify(issue.title)
  if (issueSlug !== title) {
    const redirectUrl = `/${workspaceId}/issue/${projectId}-${issueId}/${issueSlug}`
    redirect(redirectUrl, RedirectType.replace)
  }

  const activities = await getActivities(session.userId, issueId)
  const labelActivities: Extract<IssueActivityType[number], { issueActivity: "LabelActivity" }>[] = activities.filter(
    (a) => a.issueActivity === "LabelActivity",
  )
  const lastActivity = activities.at(-1) ?? { issueActivity: "None", id: -1 }
  const lastActivityInfo = {
    activityType: lastActivity.issueActivity,
    activityId: lastActivity.id,
  }

  // Get all labels and labels that are set to the issue

  return (
    <main className="flex flex-1 flex-col pb-2 lg:px-2">
      <div className="flex flex-1 lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="overlow-y-auto mx-auto w-full max-w-4xl flex-grow p-6 lg:p-10">
            {/* -- */}
            <main className="flex-1">
              <div className="py-8">
                <div className="px-2 lg:px-0 xl:max-w-full">
                  <div className="dark:border-white/10">
                    <div>
                      <div>
                        <div className="md:flex md:items-center md:justify-between md:space-x-4 xl:pb-2">
                          <div className="w-full">
                            <Suspense fallback={<div>Loading...</div>}>
                              <Editor initialContent={issue.title} placeholderText="Enter title" type="title" />
                            </Suspense>
                          </div>
                        </div>

                        {/* 2nd Column */}
                        <aside className="mt-8 xl:hidden">
                          <h2 className="sr-only">Details</h2>
                          <div className="space-y-5">
                            <div className="flex items-center space-x-2">
                              <LockClosedIcon aria-hidden="true" className="h-5 w-5 text-indigo-500" />
                              <span className="text-sm font-medium text-indigo-700">Duplicate Issue</span>
                            </div>
                          </div>
                          <div className="mt-6 space-y-8 border-b border-t border-gray-200 py-6">
                            <div>
                              <h2 className="text-sm font-medium text-gray-500">Assignees</h2>
                              <ul className="mt-3 space-y-3" role="list">
                                <li className="flex justify-start">
                                  <a className="flex items-center space-x-3" href="#">
                                    <div className="flex-shrink-0">
                                      <img
                                        alt=""
                                        className="h-5 w-5 rounded-full"
                                        src="https://images.unsplash.com/photo-1520785643438-5bf77931f493?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80"
                                      />
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">Eduardo Benz</div>
                                  </a>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <h2 className="text-sm font-medium text-gray-500">Tags</h2>
                              <ul className="mt-2 leading-8" role="list">
                                <li className="inline">
                                  <a
                                    className="relative inline-flex items-center rounded-full border border-gray-300 px-3 py-0.5"
                                    href="#"
                                  >
                                    <div className="absolute flex flex-shrink-0 items-center justify-center">
                                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    </div>
                                    <div className="ml-3.5 text-sm font-medium text-gray-900">Bug</div>
                                  </a>{" "}
                                </li>
                                <li className="inline">
                                  <a
                                    className="relative inline-flex items-center rounded-full border border-gray-300 px-3 py-0.5"
                                    href="#"
                                  >
                                    <div className="absolute flex flex-shrink-0 items-center justify-center">
                                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                    </div>
                                    <div className="ml-3.5 text-sm font-medium text-gray-900">Accessibility</div>
                                  </a>{" "}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </aside>
                        <div className="py-2 xl:pb-0">
                          <h2 className="sr-only">Description</h2>
                          <Suspense fallback={<div>Loading...</div>}>
                            <DescriptionField
                              issueId={issue.id}
                              lastActivity={lastActivityInfo}
                              value={issue.description}
                            />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                    <section aria-labelledby="activity-title" className="mt-8 xl:mt-10">
                      <div>
                        <div>
                          <Divider className="pb-4" />
                          <div className="pt-6">
                            {/* Activity feed*/}
                            <ActivityFeed activities={activities} issue={issue} />
                            <div className="mt-6">
                              <div className="flex space-x-3">
                                <div className="min-w-0 flex-1">
                                  <label className="sr-only" htmlFor="comment">
                                    Comment
                                  </label>
                                  <AddComment issueId={issue.id} lastActivity={lastActivityInfo} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </main>
            {/* Here */}
          </div>
          {/* Right desktop sidebar */}
          <div className="hidden h-full w-auto flex-shrink-0 overflow-hidden rounded-r-lg border-l border-zinc-200 bg-white dark:border-zinc-700 lg:block">
            <div className="sticky top-0 h-full p-6">
              <div className="h-full">
                <div className="flex w-72 flex-col gap-2">
                  <div key="status">
                    <Suspense fallback={<p>Loading</p>}>
                      <StatusProperty issueId={issue.id} lastActivity={lastActivityInfo} value={issue.status} />
                    </Suspense>
                  </div>
                  <div key="priority">
                    <Suspense fallback={<p>Loading</p>}>
                      <PriorityProperty issueId={issue.id} lastActivity={lastActivityInfo} value={issue.priority} />
                    </Suspense>
                  </div>
                  <div key="assigned_to">
                    <Suspense fallback={<p>Loading</p>}>
                      <AssigneeProperty
                        issueId={issue.id}
                        lastActivity={lastActivityInfo}
                        projectMembers={issue.project.members}
                        value={issue.assignedUserId}
                      />
                    </Suspense>
                  </div>
                  <div key="labels">
                    <div className="space-y-2">
                      <span className="select-none text-xs font-medium text-zinc-400">Labels</span>
                      <ul className="flex flex-wrap items-center gap-1.5" role="list">
                        {issueLabels.map((label) => {
                          const labelInfo = labels.find((l) => l.id === label.label.id)
                          return (
                            <li className="inline" key={label.label.id}>
                              <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-2xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200">
                                <div
                                  className={classNames(
                                    COLORS[labelInfo?.color] || "bg-zinc-100",
                                    "flex-none rounded-full p-1",
                                  )}
                                >
                                  <div className="size-2 rounded-full bg-current" />
                                </div>
                                {labelInfo?.name}
                              </span>
                            </li>
                          )
                        })}
                        <li>
                          <AddLabelButton
                            activities={labelActivities}
                            issueId={issue.id}
                            issueLabels={issueLabels}
                            labels={labels}
                          />
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
