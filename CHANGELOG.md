# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

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

[Unreleased]: https://github.com/meltwater/mlabs-aws/compare/v1.5.1...HEAD
[1.5.1]: https://github.com/meltwater/mlabs-aws/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/meltwater/mlabs-aws/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/meltwater/mlabs-aws/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/meltwater/mlabs-aws/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/meltwater/mlabs-aws/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/meltwater/mlabs-aws/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/meltwater/mlabs-aws/compare/v1.0.0...v1.1.0
