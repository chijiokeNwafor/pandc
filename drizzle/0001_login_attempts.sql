CREATE TABLE login_attempts (
  id integer PRIMARY KEY NOT NULL,
  bucket integer NOT NULL,
  attempts integer NOT NULL
);
