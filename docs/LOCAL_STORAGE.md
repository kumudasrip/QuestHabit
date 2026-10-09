# Local storage and privacy

The app stores one JSON document under `questhabit.state`. It includes the local profile, preferences, quests, completion records, and unlocked achievement IDs.

There is no account, login, backend, cloud database, or cross-device synchronization. Refreshing or reopening the deployed site in the same browser profile reads the same browser storage. Another browser, device, private window, or cleared site data has a separate or empty state.

The Settings page exports a JSON backup and imports only after basic shape validation and explicit confirmation. Invalid JSON is rejected without replacing existing state. Corrupt stored state starts a fresh profile and surfaces a recovery message. Storage write failures surface a warning because browser storage can be blocked or full.
