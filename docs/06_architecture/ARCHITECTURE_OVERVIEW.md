# Architecture Overview

Cliplot is planned as a thin storefront and integration boundary over shared
Alfares commerce systems.

No app-local database is planned for GOAL-02 unless the execution plan proves a
need for local state. Catalog, Warehouse, Orders, Payments, Notifications, Auth,
Logging, and AI keep their authoritative roles.
