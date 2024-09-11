# FormSG International Edition

Builds and publishes a Docker image to 
opengovsg/formsg-intl

# Overview

This repository consists of the following meaningful parts:

### `replacements/`
A minimal set of source files used to replace parts of the FormSG codebase,
hiding or removing features specific to Singapore

### `Dockerfile`
A variation of the original `Dockerfile` in the FormSG codebase used
to build production images. This variation deliberately installs 
[MockPass](https://github.com/opengovsg/mockpass) to add placeholder
certificates. These certificates are usually used by FormSG to interact
with Singpass and Corppass, and are hence required at runtime.

### `.github/workflows/ci.yml`
A GitHub Actions workflow to:
- copy the original FormSG codebase
- replace some of the source code using the files in `replacements/`
- build a Docker image using `Dockerfile`, pushing the result to Docker Hub
  
## Creating a fork of FormSG without Singapore-specific features
- Fork the original codebase at [opengovsg/FormSG](https://github.com/opengovsg/FormSG)
- Clone the resulting repository onto your local machine
- While in the directory containing your repository, clone the formsg-intl repository
  into a subdirectory called `formsg-intl`
```
git clone --depth 1 git@github.com:opengovsg/formsg-intl
```
- Replace `Dockerfile`, and remove Singapore-specific features by replacing
  corresponding files with equivalents using the following command: 
```
cp -rf formsg-intl/replacements/* .
cp -f formsg-intl/Dockerfile .
```
- Once replacements are complete, remove the `formsg-intl/` directory with the command:
```
rm -rf formsg-intl
```

You now have a codebase of FormSG that has most of the Singapore-specific features hidden.
note that the code implementing these features may still be present, so you are free to
remove them, or study them to understand how you might build equivalent features in your 
local context.
