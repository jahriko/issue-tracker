import { getCurrentUser } from "@/lib/get-current-user"
import { getPrisma } from "@/lib/getPrisma"
import { notFound } from "next/navigation"
export default async function SettingsPage({ params }: { params: { workspaceId: string } }) {
  const { workspaceId } = params

  const session = await getCurrentUser()

  const workspace = await getPrisma(session.userId).workspace.findUnique({
    where: {
      url: workspaceId,
    },
  })

  if (!workspace) {
    notFound()
  }

  return (
    <div>
      <h2 className="text-base font-semibold leading-7 text-gray-900">Workspace</h2>
      <p className="mt-1 text-sm leading-6 text-gray-500">
        This information will be displayed publicly so be careful what you share.
      </p>

      <dl className="mt-6 space-y-6 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
        <div className="pt-6 sm:flex">
          <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Workspace name</dt>
          <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
            <div className="text-gray-900">{workspace.name}</div>
            <button className="font-semibold text-indigo-600 hover:text-indigo-500" type="button">
              Update
            </button>
          </dd>
        </div>
      </dl>
      <dl className="mt-6 space-y-6 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
        <div className="pt-6 sm:flex">
          <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">URL</dt>
          <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
            <div className="text-gray-900">{workspace.url}</div>
            <button className="font-semibold text-indigo-600 hover:text-indigo-500" type="button">
              Update
            </button>
          </dd>
        </div>
      </dl>
    </div>
  )
}
