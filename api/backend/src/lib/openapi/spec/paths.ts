import { healthPaths } from './paths/health'
import { authPaths } from './paths/auth'
import { usersPaths } from './paths/users'
import { branchesPaths } from './paths/branches'
import { newsPaths } from './paths/news'
import { announcementsPaths } from './paths/announcements'
import { topicsPaths } from './paths/topics'
import { contactPaths } from './paths/contact'
import { trainingsPaths } from './paths/trainings'
import { lessonsPaths } from './paths/lessons'
import { notificationsPaths } from './paths/notifications'
import { miscPaths } from './paths/misc'
import { activitiesPaths } from './paths/activities'
import { activityCategoriesPaths } from './paths/activity-categories'
import { reportsPaths } from './paths/reports'

export const paths = {
  ...healthPaths,
  ...authPaths,
  ...usersPaths,
  ...branchesPaths,
  ...newsPaths,
  ...announcementsPaths,
  ...topicsPaths,
  ...contactPaths,
  ...trainingsPaths,
  ...lessonsPaths,
  ...notificationsPaths,
  ...miscPaths,
  ...activitiesPaths,
  ...activityCategoriesPaths,
  ...reportsPaths,
}
