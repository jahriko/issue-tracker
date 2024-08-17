/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable guard-for-in */
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import { Priority, Status } from '@prisma/client';
import { hash } from 'bcrypt';

const slugify = (str: string) => {
  return str
    .toLowerCase()
    .replace(/ /g, '-') // Replace space with dash
    .replace(/[^a-z0-9-]/g, '') // no special characters
    .replace(/-{2,}/g, '-') // Prevent more than one dash between letters/numbers
    .replace(/^-/, ''); // Remove dash if it's the first character
};

async function main() {
  await prisma.$transaction(
    async (tx) => {
      console.log('Clearing existing data');
      await tx.discussionLike.deleteMany();
      await tx.discussionPost.deleteMany();
      await tx.discussion.deleteMany();
      await tx.discussionCategory.deleteMany();
      await tx.issueLabel.deleteMany();
      await tx.issueActivity.deleteMany();
      await tx.issue.deleteMany();
      await tx.projectMember.deleteMany();
      await tx.project.deleteMany();
      await tx.workspaceMember.deleteMany();
      await tx.workspace.deleteMany();
      await tx.label.deleteMany();
      await tx.user.deleteMany();

      console.log('Creating labels');
      const labels = await tx.label
        .createManyAndReturn({
          data: [
            { name: 'Bug', color: 'red' },
            { name: 'Feature', color: 'green' },
            { name: 'Documentation', color: 'blue' },
            { name: 'Improvement', color: 'yellow' },
            { name: 'Help Wanted', color: 'purple' },
            { name: 'Good First Issue', color: 'orange' },
          ],
          select: {
            id: true,
          },
        })
        .then((labels) => labels.map((l) => l.id));

      // Create users
      const users = await tx.user
        .createManyAndReturn({
          data: await Promise.all(
            Array.from({ length: 15 }, async () => ({
              image: faker.image.avatar(),
              name: `${faker.person.firstName()} ${faker.person.lastName()}`,
              email: faker.internet.exampleEmail(),
              hashedPassword: await hash('12345678', 13),
            })),
          ),
          select: {
            id: true,
          },
        })
        .then((users) => users.map((u) => u.id));

      console.log('Creating workspaces and projects');
      const workspaceOwner = await tx.user.create({
        data: {
          image: faker.image.avatar(),
          name: faker.person.fullName(),
          email: faker.internet.exampleEmail(),
          hashedPassword: await hash('12345678', 13),
        },
      });

      const workspaceName = faker.company.name();
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          ownerId: workspaceOwner.id,
          url: slugify(workspaceName),
          members: {
            create: users.map((userId) => ({
              userId,
              role: 'MEMBER',
            })),
          },
        },
      });

      console.log('Updating users lastWorkspaceUrl');
      await tx.user.updateMany({
        where: {
          id: {
            in: (
              await tx.workspaceMember.findMany({
                where: { workspaceId: workspace.id },
                select: { userId: true },
              })
            ).map((m) => m.userId),
          },
        },
        data: { lastWorkspaceUrl: workspace.url },
      });

      console.log('Updating 3 added members to admins');
      const adminIds = faker.helpers.arrayElements(users, 3);
      console.log(`Selected admin IDs: ${adminIds.join(', ')}`);

      // Check if all selected adminIds are valid workspace members
      const existingMembers = await tx.workspaceMember.findMany({
        where: { userId: { in: adminIds }, workspaceId: workspace.id },
        select: { userId: true },
      });
      console.log(
        `Existing members: ${existingMembers.map((m) => m.userId).join(', ')}`,
      );

      if (existingMembers.length < 3) {
        console.warn(
          `Only ${existingMembers.length} of the selected admin IDs are valid workspace members`,
        );
      }

      const updateResult = await tx.workspaceMember.updateMany({
        where: { userId: { in: adminIds }, workspaceId: workspace.id },
        data: { role: 'ADMIN' },
      });
      console.log(
        `Update result: ${updateResult.count} members updated to ADMIN`,
      );

      // Verify the update
      const updatedAdmins = await tx.workspaceMember.findMany({
        where: {
          userId: { in: adminIds },
          workspaceId: workspace.id,
          role: 'ADMIN',
        },
        select: { userId: true, role: true },
      });
      console.log(`Updated admins: ${JSON.stringify(updatedAdmins)}`);

      // If we still don't have 3 admins, try to add more
      if (updatedAdmins.length < 3) {
        console.log('Attempting to add more admins to reach 3');
        const remainingMembers = await tx.workspaceMember.findMany({
          where: {
            workspaceId: workspace.id,
            role: 'MEMBER',
            userId: { notIn: updatedAdmins.map((a) => a.userId) },
          },
          take: 3 - updatedAdmins.length,
          select: { userId: true },
        });

        if (remainingMembers.length > 0) {
          const additionalUpdateResult = await tx.workspaceMember.updateMany({
            where: {
              userId: { in: remainingMembers.map((m) => m.userId) },
              workspaceId: workspace.id,
            },
            data: { role: 'ADMIN' },
          });
          console.log(
            `Additional update result: ${additionalUpdateResult.count} more members updated to ADMIN`,
          );
        }
      }

      // Final verification
      const finalAdmins = await tx.workspaceMember.findMany({
        where: { workspaceId: workspace.id, role: 'ADMIN' },
        select: { userId: true, role: true },
      });
      console.log(`Final admins: ${JSON.stringify(finalAdmins)}`);

      console.log('Creating projects and adding project members');
      const workspaceIds = [workspace.id];
      for (const workspaceId of workspaceIds) {
        const projects = await tx.project.createMany({
          data: Array.from({ length: 2 }, () => {
            const projectTitle = faker.company.name();
            return {
              title: projectTitle,
              identifier: projectTitle.substring(0, 3).toUpperCase(),
              workspaceId,
            };
          }),
          skipDuplicates: true,
        });

        const projectIds = (
          await tx.project.findMany({
            where: { workspaceId },
            select: { id: true },
          })
        ).map((p) => p.id);

        for (const projectId of projectIds) {
          // Add 3-4 members to each project
          const memberCount = faker.number.int({ min: 3, max: 4 });
          await tx.projectMember.createMany({
            data: faker.helpers
              .arrayElements(users, memberCount)
              .map((userId) => ({
                userId,
                projectId,
              })),
            skipDuplicates: true,
          });
        }
      }

      console.log('Creating issues');
      const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'NO_PRIORITY'];
      const statuses: Status[] = [
        'BACKLOG',
        'IN_PROGRESS',
        'DONE',
        'CANCELLED',
      ];

      const projectIds = await tx.project
        .findMany({
          where: { workspaceId: workspace.id },
          select: { id: true },
        })
        .then((projects) => projects.map((p) => p.id));

      for (const projectId of projectIds) {
        const projectMembers = await tx.projectMember.findMany({
          where: { projectId },
          select: { userId: true },
        });
        const projectMemberIds = projectMembers.map((member) => member.userId);

        if (projectMemberIds.length === 0) {
          console.warn(
            `Project ${projectId} has no members. Skipping issue creation.`,
          );
          continue;
        }

        const issues = await tx.issue.createMany({
          data: Array.from({ length: 15 }, () => ({
            title: faker.hacker.phrase(),
            description: generateMarkdownDescription(),
            priority: faker.helpers.arrayElement(priorities),
            status: faker.helpers.arrayElement(statuses),
            projectId,
            ownerId: faker.helpers.arrayElement(projectMemberIds),
          })),
          skipDuplicates: true,
        });
      }

      console.log('Assigning labels to issues');
      const issueIds = (
        await tx.issue.findMany({
          where: { projectId: { in: projectIds } },
          select: { id: true },
        })
      ).map((i) => i.id);
      await tx.issueLabel.createMany({
        data: issueIds.flatMap((issueId) =>
          faker.helpers
            .arrayElements(labels, faker.number.int({ min: 0, max: 4 }))
            .map((labelId) => ({ issueId, labelId })),
        ),
        skipDuplicates: true,
      });

      console.log('Creating discussion categories');
      const discussionCategories = await tx.discussionCategory.createMany({
        data: projectIds.flatMap((projectId) =>
          Array.from({ length: 3 }, () => ({
            name: faker.lorem.word(),
            description: faker.lorem.sentence(),
            emoji: faker.internet.emoji(),
            projectId,
          })),
        ),
        skipDuplicates: true,
      });

      console.log('Creating discussions and posts');
      const categoryIds = (
        await tx.discussionCategory.findMany({ select: { id: true } })
      ).map((c) => c.id);
      for (const projectId of projectIds) {
        const discussions = await tx.discussion.createMany({
          data: Array.from({ length: 5 }, () => ({
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraphs(),
            projectId,
            authorId: faker.helpers.arrayElement(users),
            categoryId: faker.helpers.arrayElement(categoryIds),
            isResolved: faker.datatype.boolean(),
            viewCount: faker.number.int({ min: 0, max: 100 }),
            likeCount: faker.number.int({ min: 0, max: 50 }),
            workspaceId: workspace.id,
          })),
          skipDuplicates: true,
        });

        const discussionIds = (
          await tx.discussion.findMany({
            where: { projectId },
            select: { id: true },
          })
        ).map((d) => d.id);

        console.log('Creating discussion posts');
        for (const discussionId of discussionIds) {
          await tx.discussionPost.createMany({
            data: Array.from(
              { length: faker.number.int({ min: 1, max: 10 }) },
              () => ({
                content: faker.lorem.paragraph(),
                discussionId,
                authorId: faker.helpers.arrayElement(users),
                isAccepted: faker.datatype.boolean(),
              }),
            ),
            skipDuplicates: true,
          });
        }

        console.log('Creating discussion likes');
        await tx.discussionLike.createMany({
          data: discussionIds.flatMap((discussionId) =>
            faker.helpers
              .arrayElements(users, faker.number.int({ min: 0, max: 10 }))
              .map((userId) => ({ discussionId, userId })),
          ),
          skipDuplicates: true,
        });
      }
    },
    {
      maxWait: 15000, // default: 2000
      timeout: 60000, // default: 5000
    },
  );
}

function generateMarkdownDescription() {
  return `
${faker.lorem.paragraphs()}

## Steps to Reproduce

1. ${faker.lorem.sentence()}
2. ${faker.lorem.sentence()}
3. ${faker.lorem.sentence()}

## Expected Behavior

${faker.lorem.paragraph()}

## Actual Behavior

${faker.lorem.paragraph()}

## Additional Notes

${faker.lorem.paragraph()}
  `.trim();
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
