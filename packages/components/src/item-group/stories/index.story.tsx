/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { ItemGroup } from '../item-group/component';
import { Item } from '../item/component';

type ItemProps = React.ComponentPropsWithoutRef< typeof Item >;

const meta: Meta< typeof ItemGroup > = {
	component: ItemGroup,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { Item },
	title: 'Components (Experimental)/ItemGroup',
	argTypes: {
		as: { control: false },
		children: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const mapPropsToItem = ( props: ItemProps, index: number ) => (
	<Item { ...props } key={ index } />
);

const Template: StoryFn< typeof ItemGroup > = ( props ) => (
	<ItemGroup { ...props } />
);

export const Default: StoryFn< typeof ItemGroup > = Template.bind( {} );
Default.args = {
	isBordered: true,
	isSeparated: true,
	children: (
		[
			{
				children: 'First button item',
				// eslint-disable-next-line no-alert
				onClick: () => alert( 'First item clicked' ),
			},
			{
				children: 'Second button item',
				// eslint-disable-next-line no-alert
				onClick: () => alert( 'Second item clicked' ),
			},
			{
				children: 'Third button item',
				// eslint-disable-next-line no-alert
				onClick: () => alert( 'Third item clicked' ),
			},
			{
				children: 'Anchor item',
				as: 'a',
				href: 'https://wordpress.org',
			},
		] as ItemProps[]
	 ).map( mapPropsToItem ),
};

export const NonClickableItems: StoryFn< typeof ItemGroup > = Template.bind(
	{}
);
NonClickableItems.args = {
	...Default.args,
	children: (
		[
			{
				children:
					"This <Item /> is not click-able because it doesn't have an `onClick` prop",
			},
			{
				children:
					"This <Item /> is also not click-able because it doesn't have an `onClick` prop",
			},
		] as ItemProps[]
	 ).map( mapPropsToItem ),
};

export const CustomItemSize: StoryFn< typeof ItemGroup > = Template.bind( {} );
CustomItemSize.args = {
	...Default.args,
	children: (
		[
			{
				children:
					'This <Item /> will inherit the size from <ItemGroup /> (try changing the size prop)',
			},
			{
				children:
					'This <Item /> has a hardcoded size="large", regardless of <ItemGroup />\'s size',
				size: 'large',
			},
		] as ItemProps[]
	 ).map( mapPropsToItem ),
};

export const WithoutBorder: StoryFn< typeof ItemGroup > = Template.bind( {} );
WithoutBorder.args = {
	...Default.args,
	isBordered: false,
	isSeparated: false,
};
