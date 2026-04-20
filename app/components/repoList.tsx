type RepoListProps = {
  repos: string[];
  selected: string;
  setSelectedRepo: (repo: string) => void;
};

export default function RepoList({
  repos,
  selected,
  setSelectedRepo,
}: RepoListProps) {
  return (
    <ul>
      {repos.map((repo, index) => (
        <li
          key={index}
          onClick={() => {
            if (selected === repo) {
              setSelectedRepo("");
            } else {
              setSelectedRepo(repo);
            }
          }}
          className={`cursor-pointer ${selected === repo ? "bg-blue-600 text-white" : ""}`}
        >
          {repo}
        </li>
      ))}
    </ul>
  );
}
