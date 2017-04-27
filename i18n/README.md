## Internationalization

To localise this into your language, create a JSON file in this directory with the ISO 639 alpha2 code of your
language. If there is no ISO 639 alpha2 code, use the ISO 3166 alpha3 code. If that doesn't exist either,
assign yourself an arbitrary language code from between `qaa` and `qpz`. For example, a French localisation would
use `fr.json`.

Parameters are passed to some strings. You can access the parameter by enclosing them in double curly brackets: e.g. `Page {{curr}} of {{total}}`.

To aid i18n efforts, the special `qqx` language code can be used.
The `qqx.json` file contains message documentation for some strings, which may be useful.

In addition, the website can be viewed with the `qqx` language code (`?uselang=qqx`).
Instead of displaying the contents of `qqx.json`, the system will output the message keys, within
angle brackets. Any parameter names will also be output, after a pipe, and separated by middle dots.
For example, `⟨foo-bar|baz·xyzzy⟩` means that that message is found with the `foo-bar` key, and supplies
two arguments, `{{bar}}` and `{{xyzzy}}`.

Ensure you set a value for the `autonym` key. This should be equal to the name of the language, in that language.
It is used in the footer of the website to allow switching languages easily.

You can force a permanent language change by visiting `/change-lang/` followed by the ISO code; for example, `/change-lang/en`.
You can also force a temporary change by appending `?uselang=` followed by the code.

As well as localising content, you can also localise URL routes. For example, `/book-club` can be localised to
`/clwb-llyfr`. Parts of strings beginning with colons, such as `:isbn` in `/book-club/book/:isbn/edit`, should not
be modified.

