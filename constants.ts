import { Job, JobType } from './types';

// Initial data for the app so it doesn't look empty
export const MOCK_JOBS: Job[] = [
  {
    id: 'job_1',
    title: '中文翻译 (Chinese Translator)',
    company: 'Golden Myanmar Garment Co.',
    location: '仰光 (Yangon) - Hlaing Tharyar',
    salaryRange: '80万 - 120万 MMK',
    type: JobType.FULL_TIME,
    description: '负责工厂内部中缅文翻译，协助管理层与当地员工沟通。需要中文流利，有工厂经验者优先。',
    requirements: ['中文听说读写流利', '缅甸语母语', '有工厂翻译经验优先', '能接受加班'],
    tags: ['翻译', '工厂', '包吃住'],
    postedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    contactEmail: 'hr@goldenmyanmar.com'
  },
  {
    id: 'job_2',
    title: '销售经理 (Sales Manager)',
    company: 'Oppo Mobile Myanmar',
    location: '曼德勒 (Mandalay)',
    salaryRange: '150万 - 300万 MMK',
    type: JobType.FULL_TIME,
    description: '负责曼德勒地区的手机销售渠道拓展，管理销售团队。',
    requirements: ['3年以上销售经验', '有团队管理经验', '熟悉手机市场', '会中文优先'],
    tags: ['销售', '管理', '高提成'],
    postedAt: new Date(Date.now() - 86400000 * 2),
    contactEmail: 'sales@oppo.mm'
  },
  {
    id: 'job_3',
    title: '会计助理 (Accounting Assistant)',
    company: 'Yangon Logistics Ltd',
    location: '仰光 (Yangon) - Downtown',
    salaryRange: '50万 - 80万 MMK',
    type: JobType.FULL_TIME,
    description: '协助处理日常财务报表，税务申报，以及办公室行政事务。',
    requirements: ['LCCI Level 2/3', '熟练使用Excel', '细心负责'],
    tags: ['财务', '行政', '办公室'],
    postedAt: new Date(Date.now() - 86400000 * 5),
    contactEmail: 'finance@ylogistics.com'
  }
];