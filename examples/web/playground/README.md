# Playground

A Monaco editor for the message stream on the left, and on the right what the store made
of it: the surfaces, the events they dispatched, and the rendered result. A timeline above
lets you apply the stream one message at a time and see the surface build up.

```sh
pnpm dev:playground      # :5181  (also `pnpm dev`)
```

![The playground on the spec's Recipe Card example: the message stream in the editor, the timeline stepped to the last message, and the Render tab showing the card](screenshots/playground.png)

The **Sample** menu carries the 43 official v1.0 spec examples and a few of the
playground's own. **Send update** and **Data model** stage a follow-up message against the
live store, which is how to try an `updateComponents` or an `updateDataModel` against a
surface that already exists.
