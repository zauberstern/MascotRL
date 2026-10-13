# MascotRL

You buy a fund because of a sentence on the first page. It chases what has been rising. It buys what just fell. It stays quiet when the market gets loud. That sentence is why the page exists. You can hold it up to the stocks in the fund and ask whether they look like the words.

A learning machine skips the sentence. Each morning it returns a list: this much in this stock, that much in the next, and a number for how the day went. Chase, fade, or hide. The list does not say. This repository is the reading of that list.

## Six habits

A cheetah leans into what has already been moving the same way. The book adds to winners and cuts losers.

A fox leans the other way. What ran up gets sold. What fell gets bought.

A tortoise keeps the day's risk small. It prefers the quiet names, and it pays the toll when the book changes.

A magpie gathers the loudest score and puts almost all the money there.

A hummingbird keeps moving. The holdings turn over, and the list is new often.

An owl does not lead on any one of those tests. The scores sit close together, so the reading stays general.

Of 179 books that cleared the screen, the reading named 11 cheetahs, 32 foxes, 18 tortoises, 21 magpies, 19 hummingbirds, and 78 owls.

## The screen

The screen asks a plain question. If you split the fund into the same slice of every stock, how far is this list from that split?

A book within 12.5 percent of an even split stays unnamed. The list is too close to "a bit of everything" for a habit name to be honest. The name stays off, and the book is not counted among the 179.

## Someone had already written a name

Training began with a design. Some books were built to chase, some to fade, some to keep risk small, some to crowd into one name, some to keep turning over. That design is a name written before the path exists.

Of 106 books that already had a design name, the later reading agreed on the strict rule 7 times. Picture a shelf of 106 labelled jars. You open each one and apply the same tests. Seven jars hold what the label says.

## The toll

Changing the holdings is not free. The training step charges five basis points, five cents on a hundred dollars moved, while the book learns. The same five is charged again on the path you read.

![Three median costs next to the five that were configured](site/assets/cost.svg)

These are the median costs that showed up, in basis points, next to the five that were configured. The bars are a bill for changing the holdings.

When a stock can be left at zero, the median was about 6.5 basis points. When every stock keeps a crumb, it was about 10.2. When each score is capped and the book is filled again, it was about 13.4.

## One dollar, month by month

![One dollar compounded from January 2014 through December 2024](site/assets/growth.svg)

Each line starts as one dollar in January 2014 and shows what that dollar became through December 2024. Gold is an even split. Each other line is one stored book for that habit, after the toll when the book changes its holdings.

## One day's decision

A morning has six parts, in this order.

Yesterday's news is already in the file: how each stock moved, how loud it was, how the list sat the day before. Nothing from today is allowed in.

A hunch for each stock is a single number. Higher means the book wants more of that name. The hunch is not yet a holding.

A rule turns the hunches into shares of one fund. The shares are zero or positive, and they add to the whole. One rule lets many stocks sit at zero. Another leaves every stock a crumb. Another caps the scores and fills the fund again.

A grade for the day says how the list did after the toll. The book is taught on that grade.

The list of amounts is what you can hold up to the first page: this much here, that much there.

The toll is the charge for the gap between yesterday's list and today's.

## How to look

The pages are at [https://zauberstern.github.io/MascotRL/](https://zauberstern.github.io/MascotRL/).

[Home](https://zauberstern.github.io/MascotRL/) is this reading, with the six habits and the counts.

[Staff the years](https://zauberstern.github.io/MascotRL/desk.html) lets you hand each year to one habit and watch the dollars, next to an even split of the same stocks.

[Yesterday's clues](https://zauberstern.github.io/MascotRL/cube.html) opens one past day as a block of numbers. You can see what the book was allowed to know, and what it was not.

[Try your own stocks](https://zauberstern.github.io/MascotRL/book.html) takes a file of your prices and returns a list for one day.

## What is here

This note. The working paper, as a PDF, linked from the top of the site. The four pages, and the files they need so they do not fetch a viewer from somewhere else.

The small Python in `src/` is the part a reader can check without the trainer: how hunches become shares, how the five basis points are charged, how a list too close to an even split stays unnamed, and how a finished path receives one of the six names.

## What is not here

The trainer is not in this repository. The market files are not here. The code that taught the books is not here. There is no account, no broker, and no live book.

Results replay old prices and are not a recommendation to buy or sell.

Silhouettes: Michaud, Sayol, Mauel, Jablunovsky, Sayol, Sayol. PhyloPic, CC0.
