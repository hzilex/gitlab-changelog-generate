# gitlab-changelog-generator
A tool generate changelog from gitlab merge request.

## Requirement
- Merge request must have milestone
- Milestone needs due date
- Support merge request labels
  - feature
  - bug
  - docs
  - improve

## Usage
 ``` 
 node main.js --baseUrl={gitlab api url} --token={private token} --pid={gitlab project id} --dst={output filename} 
 ```
