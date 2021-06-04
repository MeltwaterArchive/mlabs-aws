# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.1.0] / 2021-06-03

### Added

- Register `execId` in container.
- `reqId` to message attributes.

### Changed

- Default value for `attributeNames` is now `['All']`.
- Default value for `messageAttributeNames` is now `['All']`.
- Read `reqId` from message attributes first.

### Fixed

- `reqId` not added to message body.

## [2.0.0] / 2021-01-03

### Added

- Publish as both ES and CommonJS module.

### Changed

- (**Breaking**) Use Conditional Exports to provide ES or CommonJS module.
  Cannot import or require internal paths.
- (**Breaking**) Drop support for Node.js versions before 12.13.0.

## [1.5.1] / 2020-11-17

### Changed

- Update all dependencies and test on Node Fermium.
- License to MIT.

## [1.5.0] / 2020-06-17

### Changed

- Update all dependencies.

## [1.4.0] / 2020-04-14

### Added

- Register new function for message processor:
  `startUpdatingVisibilityTimeout`.

## [1.3.1] / 2020-04-13

### Fixed

- Default QueueUrl missing when `clientOptions` passed.

## [1.3.0] / 2020-04-13

### Added

- Register `receiptHandle` in scoped container.
- Pass message object as third argument to processor.

### Fixed

- Docs incorrectly stated the message object is
  passed as second argument to processor,
  but in actuality the scoped Awilix container is passed.

## [1.2.0] / 2020-04-13

### Added

- Pass `QueueUrl` as default param to SQS client.

### Changed

- Update all dependencies.

## [1.1.0] / 2020-03-19

### Changed

- Update all dependencies.

## 1.0.0 / 2019-05-21

- Initial release.

[Unreleased]: https://github.com/meltwater/mlabs-aws/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/meltwater/mlabs-aws/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/meltwater/mlabs-aws/compare/v1.5.1...v2.0.0
[1.5.1]: https://github.com/meltwater/mlabs-aws/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/meltwater/mlabs-aws/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/meltwater/mlabs-aws/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/meltwater/mlabs-aws/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/meltwater/mlabs-aws/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/meltwater/mlabs-aws/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/meltwater/mlabs-aws/compare/v1.0.0...v1.1.0
