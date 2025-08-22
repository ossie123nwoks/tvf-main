export type RootStackParamList = {
  '(tabs)': undefined;
  'sermon/[id]': { id: string };
  'article/[id]': { id: string };
};

export type TabParamList = {
  dashboard: undefined;
  sermons: undefined;
  articles: undefined;
  profile: undefined;
};

export type SermonDetailParams = {
  id: string;
};

export type ArticleDetailParams = {
  id: string;
};
