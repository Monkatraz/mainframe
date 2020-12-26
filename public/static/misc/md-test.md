# Markdown Test Page
***

## Syntax
***
##### Inline Formatting:
| | | |
| :--: | :-- | :-- |
| `/.../` | Italics | /This is italicized, without using `<em>`./
| `_..._` | Emphasis | _This is actually emphasis._
| `*...*` | Bold | *This is just bolded text.*
| `**...**` | Strong | **This is very important, strong text.**
| `__...__` | Underline | __This is underlined, not emphasized.__
| `^...^` | Superscript | 10^10^ Some^tiny text.^
| `~...~` | Subscript | X~1~, X~2~, Some~more tiny text.~
| `--...--` | Strikethrough | --This text was a mistake.--
| `==...==`| Mark | ==This text is important for some reason, and thus highlighted.==

##### Critical Markup:
| | | |
| :--: | :-- | :-- |
| `{++...++}` | Addition | {++You should add this text.++}
| `{--...--}` | Deletion | {--You should delete this text.--}
| `{~~...~>...~~}` | Substitution | {~~Replace this,~>With this.~~}
| `{==...==}` | Highlight | {==You should take note of this text.==}
| `{>>...<<}` | Comment | {==This highlighted text is...==}{>>Folllowed by a comment.<<}

##### Special:
| | | |
| :--: | :-- | :-- |
| `` `...` `` | Monospace | `Monospaced text.`
| `` `lang|...` ``| Inline Code | `js|console.log('Inline code!')`
| `$...$` | Math (TeX) | $\int_{-\infty}^\infty e^{-x^2}\,dx =\sqrt{\pi}$.
| `@@...@@`| Escaped | @@/This text is __escaped__, and **will only be rendered as plain text.**/@@

###### Inline Spans:
-	#font sans|Here is the sans font.|#
-	#font display|Here is the display font.|#
- #font serif|Here is the serif font.|#
- #font mono|Here is the mono font.|#
- #font handwriting|Here is the handwriting font.|#
- #font cursive|Here is the cursive font.|#
- #font 100|100|# #font 200|200|# #font 300|300|# #font 400|400|# #font 500|500|# #font 600|600|# #font 700|700|# #font 800|800|# #font 900|900|#
- #font bold|Bold.|# #font light|Light.|#
- #font bolder|Bolder.|# #font lighter|Lighter.|#
- #font 1em|1em|# #font 1.5em|1.5em|# #font 2em|2em|# #font 2.5em|2.5em|# #font 3em|3em|#
- #font 150%|150%|# #font 12px|12px|# #font 2rem|2rem|#
- #font handwriting bold 1.25em|Mixed font style text.|#

- #class fs-serif|Setting font class manually.|#
- #class fs-mono token function|Multiple classes.|#
- #class fs-serif|Nesting #color red|with|# #font sans bold|inline elements.|#|#

###### Block:
Term 1
:	Definition 1
: Definition 2

	More of definition 2.
	
Term 2
	~ Definition 1
	~ Definition 2

Term 3
	: Definition 1
	: Definition 2

##### Math
$\begin{aligned}
\int_0^1\frac{x^4(1-x)^4}{1+x^2}\,dx &=\frac{22}{7}-\pi\\ \\
\int_{-\infty}^\infty e^{-x^2}\,dx &=\sqrt{\pi}
\end{aligned}$

$f(x) = \int_{-\infty}^\infty\hat f(\xi)\,e^{2 \pi i \xi x}\,d\xi$

$$$
\begin{aligned}
\int_0^1\frac{x^4(1-x)^4}{1+x^2}\,dx &=\frac{22}{7}-\pi\\ \\
\int_{-\infty}^\infty e^{-x^2}\,dx &=\sqrt{\pi}
\end{aligned} \\

f(x) = \int_{-\infty}^\infty\hat f(\xi)\,e^{2 \pi i \xi x}\,d\xi \\

\int_{-\infty}^\infty e^{-x^2}\,dx =\sqrt{\pi} \\

\begin{aligned}
\int_0^1\frac{x^4(1-x)^4}{1+x^2}\,dx &=\frac{22}{7}-\pi\\ \\
\int_{-\infty}^\infty e^{-x^2}\,dx &=\sqrt{\pi}
\end{aligned}
$$$

// Comments
// This is a line comment.
This is some content, with this /* inline comment */ (comment that isn't rendered) running through it.
This is some content with a comment at the very end.

/* This is a 
	block comment.
*/
/* This pattern
 * looks cleaner. */

## Tests
***
- Nested syntax: 10^10~20~^
	- ==test ~~one~~ two== ~~one~two~three~~
- Nested brackets: {++ ins1 {++ ins2 ++} {-- del --} ++}
- Comments in a pargraph: Sint sit cillum pariatur eiusmod nulla pariatur ipsum. Sit laborum anim qui mollit tempor pariatur nisi minim dolor. Aliquip et{>>Here is a comment<<} adipisicing sit sit fugiat commodo id sunt. Nostrud enim ad commodo incididunt cupidatat in ullamco ullamco Lorem cupidatat velit enim et Lorem.
		
#### Styling Tests
- Links:
	- This is an [external link.](//google.com)
	- This is an [internal link.](/)
	- This is a [link with descenders: typography](//google.com) 
		-	[typography](//google.com)

##### SPECIAL CONTAINMENT PROCEDURES
***
Current containment of SCP-XXXX is __severely deficient__. It is crucial that extensive measures are implemented swiftly in order to mitigate the immediate risk of containment failure. Loss of containment for any physically measurable interval of time will instigate an instantaneous expansion event. This will result in an /XK-Class End-of-the-World scenario/.

The aforementioned containment insufficiency is due to significant power and cooling constraints being suffered by the "Apophis" Confinement Cluster, the device that is currently containing SCP-XXXX. Throttling of the cluster is causing it to operate considerably below its 6000 gigatonne rating, which is preventing the stable and safe containment of SCP-XXXX. In order to achieve stability, the continuous power and cooling capacity made available to the "Apophis" Confinement Cluster must be increased.

##### DESCRIPTION
***
SCP-XXXX is a spacetime anomaly located within the obliterated core of the Chernobyl Power Plant's No. 4 reactor, in Pripyat, Ukraine. It is naturally propagating anomaly, and is attempting to radiate out of the reactor core. It is prevented from doing so by a confinement singularity. SCP-XXXX has a widespread influence on reality, being directly responsible for a long series of anomalous phenomena that has been occurring within the Chernobyl exclusion zone since 1986.

SCP-XXXX has a small region of influence, and within this region induces radical alterations of the observed behavior of ordinary natural phenomena. This particular characteristic is an arguably natural phenomena, an expected result from the observed loss of metastability of multiple physical fields, or a 'true vacuum', within the anomaly. It is generally concluded that the Higgs, electromagnetic, and at least one unknown particle have decayed from metastability into a more stable ground state. 

It is unknown whether or not the true vacuum state was caused by an separate anomalous mechanism or if it is the anomaly itself. Regardless, SCP-XXXX mostly behaves as a pure spacetime anomaly, which complicates containment. Spacetime anomalies are mostly unaffected by local reality stabilization containment schemes. The only known containment method is confinement into an event horizon formed by an artifical singularity.

In a hypothetical, but not improbable, scenario, the containment system for SCP-XXXX could fail. If it failed, the boundary of SCP-XXXX would instantly begin expansion at the speed of light, encompassing the Earth within less than a second. The potential energy of any matter entering the boundary would rapidly drop, causing the dispersion of an enormous amount of energy, effectively atomizing the matter. SCP-XXXX would annihilate most of the solar system within hours, and boundaries expansion would continue for the life-time of the universe. As is likely evident, it is improbable that any life on Earth could survive this event.

# Headings
***

# Heading one

Sint sit cillum pariatur eiusmod nulla pariatur ipsum. Sit laborum anim qui mollit tempor pariatur nisi minim dolor. Aliquip et adipisicing sit sit fugiat commodo id sunt. Nostrud enim ad commodo incididunt cupidatat in ullamco ullamco Lorem cupidatat velit enim et Lorem. Ut laborum cillum laboris fugiat culpa sint irure do reprehenderit culpa occaecat. Exercitation esse mollit tempor magna aliqua in occaecat aliquip veniam reprehenderit nisi dolor in laboris dolore velit.

## Heading two

Aute officia nulla deserunt do deserunt cillum velit magna. Officia veniam culpa anim minim dolore labore pariatur voluptate id ad est duis quis velit dolor pariatur enim. Incididunt enim excepteur do veniam consequat culpa do voluptate dolor fugiat ad adipisicing sit. Labore officia est adipisicing dolore proident eiusmod exercitation deserunt ullamco anim do occaecat velit. Elit dolor consectetur proident sunt aliquip est do tempor quis aliqua culpa aute. Duis in tempor exercitation pariatur et adipisicing mollit irure tempor ut enim esse commodo laboris proident. Do excepteur laborum anim esse aliquip eu sit id Lorem incididunt elit irure ea nulla dolor et. Nulla amet fugiat qui minim deserunt enim eu cupidatat aute officia do velit ea reprehenderit.

### Heading three

Voluptate cupidatat cillum elit quis ipsum eu voluptate fugiat consectetur enim. Quis ut voluptate culpa ex anim aute consectetur dolore proident voluptate exercitation eiusmod. Esse in do anim magna minim culpa sint. Adipisicing ipsum consectetur proident ullamco magna sit amet aliqua aute fugiat laborum exercitation duis et.

#### Heading four

Commodo fugiat aliqua minim quis pariatur mollit id tempor. Non occaecat minim esse enim aliqua adipisicing nostrud duis consequat eu adipisicing qui. Minim aliquip sit excepteur ipsum consequat laborum pariatur excepteur. Veniam fugiat et amet ad elit anim laborum duis mollit occaecat et et ipsum et reprehenderit. Occaecat aliquip dolore adipisicing sint labore occaecat officia fugiat. Quis adipisicing exercitation exercitation eu amet est laboris sunt nostrud ipsum reprehenderit ullamco. Enim sint ut consectetur id anim aute voluptate exercitation mollit dolore magna magna est Lorem. Ut adipisicing adipisicing aliqua ullamco voluptate labore nisi tempor esse magna incididunt.

##### Heading five

Veniam enim esse amet veniam deserunt laboris amet enim consequat. Minim nostrud deserunt cillum consectetur commodo eu enim nostrud ullamco occaecat excepteur. Aliquip et ut est commodo enim dolor amet sint excepteur. Amet ad laboris laborum deserunt sint sunt aliqua commodo ex duis deserunt enim est ex labore ut. Duis incididunt velit adipisicing non incididunt adipisicing adipisicing. Ad irure duis nisi tempor eu dolor fugiat magna et consequat tempor eu ex dolore. Mollit esse nisi qui culpa ut nisi ex proident culpa cupidatat cillum culpa occaecat anim. Ut officia sit ea nisi ea excepteur nostrud ipsum et nulla.

###### Heading six

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.


[[Top]](#top)

# Paragraphs
***

Incididunt ex adipisicing ea ullamco consectetur in voluptate proident fugiat tempor deserunt reprehenderit ullamco id dolore laborum. Do laboris laboris minim incididunt qui consectetur exercitation adipisicing dolore et magna consequat magna anim sunt. Officia fugiat Lorem sunt pariatur incididunt Lorem reprehenderit proident irure. Dolore ipsum aliqua mollit ad officia fugiat sit eu aliquip cupidatat ipsum duis laborum laborum fugiat esse. Voluptate anim ex dolore deserunt ea ex eiusmod irure. Occaecat excepteur aliqua exercitation aliquip dolor esse eu eu.

Officia dolore laborum aute incididunt commodo nisi velit est est elit et dolore elit exercitation. Enim aliquip magna id ipsum aliquip consectetur ad nulla quis. Incididunt pariatur dolor consectetur cillum enim velit cupidatat laborum quis ex.

Officia irure in non voluptate adipisicing sit amet tempor duis dolore deserunt enim ut. Reprehenderit incididunt in ad anim et deserunt deserunt Lorem laborum quis. Enim aute anim labore proident laboris voluptate elit excepteur in. Ex labore nulla velit officia ullamco Lorem Lorem id do. Dolore ullamco ipsum magna dolor pariatur voluptate ipsum id occaecat ipsum. Dolore tempor quis duis commodo quis quis enim.

[[Top]](#top)

# Blockquotes
***

Ad nisi laborum aute cupidatat magna deserunt eu id laboris id. Aliquip nulla cupidatat sint ex Lorem mollit laborum dolor amet est ut esse aute. Nostrud ex consequat id incididunt proident ipsum minim duis aliqua ut ex et ad quis. Laborum sint esse cillum anim nulla cillum consectetur aliqua sit. Nisi excepteur cillum labore amet excepteur commodo enim occaecat consequat ipsum proident exercitation duis id in.

> Ipsum et cupidatat mollit exercitation enim duis sunt irure aliqua reprehenderit mollit. Pariatur Lorem pariatur laboris do culpa do elit irure. Eiusmod amet nulla voluptate velit culpa et aliqua ad reprehenderit sit ut.

Labore ea magna Lorem consequat aliquip consectetur cillum duis dolore. Et veniam dolor qui incididunt minim amet laboris sit. Dolore ad esse commodo et dolore amet est velit ut nisi ea. Excepteur ea nulla commodo dolore anim dolore adipisicing eiusmod labore id enim esse quis mollit deserunt est. Minim ea culpa voluptate nostrud commodo proident in duis aliquip minim.

> Qui est sit et reprehenderit aute est esse enim aliqua id aliquip ea anim. Pariatur sint reprehenderit mollit velit voluptate enim consectetur sint enim. Quis exercitation proident elit non id qui culpa dolore esse aliquip consequat.

Ipsum excepteur cupidatat sunt minim ad eiusmod tempor sit.

> Deserunt excepteur adipisicing culpa pariatur cillum laboris ullamco nisi fugiat cillum officia. In cupidatat nulla aliquip tempor ad Lorem Lorem quis voluptate officia consectetur pariatur ex in est duis. Mollit id esse est elit exercitation voluptate nostrud nisi laborum magna dolore dolore tempor in est consectetur.

Adipisicing voluptate ipsum culpa voluptate id aute laboris labore esse fugiat veniam ullamco occaecat do ut. Tempor et esse reprehenderit veniam proident ipsum irure sit ullamco et labore ea excepteur nulla labore ut. Ex aute minim quis tempor in eu id id irure ea nostrud dolor esse.

[[Top]](#top)

# Lists
***

### Ordered List

1. Longan
2. Lychee
3. Excepteur ad cupidatat do elit laborum amet cillum reprehenderit consequat quis.
    Deserunt officia esse aliquip consectetur duis ut labore laborum commodo aliquip aliquip velit pariatur dolore.
4. Marionberry
5. Melon
    - Cantaloupe
    - Honeydew
    - Watermelon
6. Miracle fruit
7. Mulberry

### Unordered List

- Olive
- Orange
    - Blood orange
    - Clementine
- Papaya
- Ut aute ipsum occaecat nisi culpa Lorem id occaecat cupidatat id id magna laboris ad duis. Fugiat cillum dolore veniam nostrud proident sint consectetur eiusmod irure adipisicing.
- Passionfruit

[[Top]](#top)

# Horizontal rule
***

In dolore velit aliquip labore mollit minim tempor veniam eu veniam ad in sint aliquip mollit mollit. Ex occaecat non deserunt elit laborum sunt tempor sint consequat culpa culpa qui sit. Irure ad commodo eu voluptate mollit cillum cupidatat veniam proident amet minim reprehenderit.

***

In laboris eiusmod reprehenderit aliquip sit proident occaecat. Non sit labore anim elit veniam Lorem minim commodo eiusmod irure do minim nisi. Dolor amet cillum excepteur consequat sint non sint.

[[Top]](#top)

# Table
***

Duis sunt ut pariatur reprehenderit mollit mollit magna dolore in pariatur nulla commodo sit dolor ad fugiat. Laboris amet ea occaecat duis eu enim exercitation deserunt ea laborum occaecat reprehenderit. Et incididunt dolor commodo consequat mollit nisi proident non pariatur in et incididunt id. Eu ut et Lorem ea ex magna minim ipsum ipsum do.

| Table Heading 1 | Table Heading 2 | Center align | Right align | Table Heading 5 |
| :-------------- | :-------------- | :----------: | ----------: | :-------------- |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |
| Item 1          | Item 2          |    Item 3    |      Item 4 | Item 5          |

Minim id consequat adipisicing cupidatat laborum culpa veniam non consectetur et duis pariatur reprehenderit eu ex consectetur. Sunt nisi qui eiusmod ut cillum laborum Lorem officia aliquip laboris ullamco nostrud laboris non irure laboris. Cillum dolore labore Lorem deserunt mollit voluptate esse incididunt ex dolor.

[[Top]](#top)

# Code
***

## Inline code

Ad amet irure est magna id mollit Lorem in do duis enim. Excepteur velit nisi magna ea pariatur pariatur ullamco fugiat deserunt sint non sint. Duis duis est `code in text` velit velit aute culpa ex quis pariatur pariatur laborum aute pariatur duis tempor sunt ad. Irure magna voluptate dolore consectetur consectetur irure esse. Anim magna `<strong>in culpa qui officia</strong>` dolor eiusmod esse amet aute cupidatat aliqua do id voluptate cupidatat reprehenderit amet labore deserunt. Ad amet irure est ```console.log('Lorem ipsum.')``` magna id mollit Lorem in do duis enim.

## Highlighted

Et fugiat ad nisi amet magna labore do cillum fugiat occaecat cillum Lorem proident. In sint dolor ullamco ad do adipisicing amet id excepteur Lorem aliquip sit irure veniam laborum duis cillum. Aliqua occaecat minim cillum deserunt magna sunt laboris do do irure ea nostrud consequat ut voluptate ex.

```go
package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hi there, I love %s!", r.URL.Path[1:])
}

func main() {
    http.HandleFunc("/", handler)
    http.ListenAndServe(":8080", nil)
}
```

```ts
/** Eagerly loads the rest of the LazyDocument. */
public async _eagerLoad() {
	// Just plain get the whole object
	const response = await this._client.query<DataObject>(this._requestExpr)
	if (response.ok === false) throw new Error('Error retrieving document.')
	// Set every field to its actual value
	this._fields.forEach((field) => {
		this._setField(field, response.body[field] as DataValue)
	})
	return this
}

/** Returns the requested field as another LazyDocument.
 *  The requested field _must_ be an object for this to work. LazyDocument requires key-value pairs. */
public async _getLazy<K extends string & keyof T>(field: K): Promise<Lazyify<T[K]> & LazyDocument<T[K]>> {
	const lazydoc = await new LazyDocument<T[K]>(q.Select(field, this._requestExpr), this._client)._start()
	this._setField(field, lazydoc)
	return lazydoc as Lazyify<T[K]> & typeof lazydoc
}
```

Ex amet id ex aliquip id do laborum excepteur exercitation elit sint commodo occaecat nostrud est. Nostrud pariatur esse veniam laborum non sint magna sit laboris minim in id. Aliqua pariatur pariatur excepteur adipisicing irure culpa consequat commodo et ex id ad.

[[Top]](#top)

# Inline elements
***

Sint ea anim ipsum ad commodo cupidatat do **exercitation** incididunt et minim ad labore sunt. Minim deserunt labore laboris velit nulla incididunt ipsum nulla. Ullamco ad laborum ea qui et anim in laboris exercitation tempor sit officia laborum reprehenderit culpa velit quis. **Consequat commodo** reprehenderit duis [irure](#!) esse esse exercitation minim enim Lorem dolore duis irure. Nisi Lorem reprehenderit ea amet excepteur dolor excepteur magna labore proident voluptate ipsum. Reprehenderit ex esse deserunt aliqua ea officia mollit Lorem nulla magna enim. Et ad ipsum labore enim ipsum **cupidatat consequat**. Commodo non ea cupidatat magna deserunt dolore ipsum velit nulla elit veniam nulla eiusmod proident officia.

![Super wide](http://placekitten.com/1280/800)

*Proident sit veniam in est proident officia adipisicing* ea tempor cillum non cillum velit deserunt. Voluptate laborum incididunt sit consectetur Lorem irure incididunt voluptate nostrud. Commodo ut eiusmod tempor cupidatat esse enim minim ex anim consequat. Mollit sint culpa qui laboris quis consectetur ad sint esse. Amet anim anim minim ullamco et duis non irure. Sit tempor adipisicing ea laboris `culpa ex duis sint` anim aute reprehenderit id eu ea. Aute [excepteur proident](#!) Lorem minim adipisicing nostrud mollit ad ut voluptate do nulla esse occaecat aliqua sint anim.

![Not so big](http://placekitten.com/480/400)

Incididunt in culpa cupidatat mollit cillum qui proident sit. In cillum aliquip incididunt voluptate magna amet cupidatat cillum pariatur sint aliqua est _enim **anim** voluptate_. Magna aliquip proident incididunt id duis pariatur eiusmod incididunt commodo culpa dolore sit. Culpa do nostrud elit ad exercitation anim pariatur non minim nisi **adipisicing sunt _officia_**. Do deserunt magna mollit Lorem commodo ipsum do cupidatat mollit enim ut elit veniam ea voluptate.

Reprehenderit non eu quis in ad elit esse qui aute id [incididunt](#!) dolore cillum. Esse laboris consequat dolor anim exercitation tempor aliqua deserunt velit magna laboris. Culpa culpa minim duis amet mollit do quis amet commodo nulla irure.
