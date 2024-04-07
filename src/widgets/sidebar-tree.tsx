import { useInjection } from 'inversify-react';
import { observer } from 'mobx-react-lite';
import { MobxTree } from '@pulexui/core';
import { toJS } from 'mobx';
import { useCallback } from 'react';
import { Icon, Intent, Spinner } from '@blueprintjs/core';
import { SharedStore } from '../features/shared/state/shared.store';
import { FileStructureApiService } from '../shared/api';
import { RootFileStructure } from '../shared/model';
import { sleep } from '../shared/helper';
import { SharedController } from '../features/shared/state/shared.controller';
import { constants } from '../shared/constants';
import { router } from '../router';

export const SidebarTree = observer(({ className }: { className?: string }) => {
  const sharedStore = useInjection(SharedStore);
  const sharedController = useInjection(SharedController);
  const fileStructureApiService = useInjection(FileStructureApiService);

  const handleNodeClick = useCallback(
    async (node: RootFileStructure) => {
      if (node.isFile) {
        //TODO check if is file and if file show popup just like in root page on double click
        console.log('ignoring file click for now');
        return;
      }

      // 1. It is better to select node first for animation speed
      node.setIsSelected(true);

      // 2. And then recusrively deselect others except the selected node
      node.recusive(sharedStore.activeRootFileStructure, n => {
        if (n.id !== node.id) {
          n.setIsSelected(false);
        }
      });

      if (node && node.link) {
        const existingLocation = window.location;

        const nodeUrlObj = new URL(existingLocation.origin + node.link);
        const existingUrlObj = new URL(existingLocation.href);

        // check node data click happens on same page
        if (
          nodeUrlObj.searchParams.get('id') === existingUrlObj.searchParams.get('id') &&
          nodeUrlObj.searchParams.get('root_parent_id') ===
            existingUrlObj.searchParams.get('root_parent_id')
        ) {
          return;
        }

        // if click happens from other pages redirect and activate loader
        if (existingLocation.pathname !== constants.path.fileStructure) {
          router.navigate(node.link);
        } else {
          // Push to history
          sharedController.pushToHistory(node.link);
        }
      }
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleNodeToggle = useCallback(
    async (node: RootFileStructure, value: boolean) => {
      if (value && node && !node.children?.length) {
        node.setActiveIcon('spinner');
        node.setHasCaret(false);
        node.setDisabled(true);

        const startTime = new Date(); // Start time
        const { data, error } = await fileStructureApiService.getContent({ parentId: node.id });

        if (error) {
          throw new Error('Something went wrong');
        }

        // Calculate time taken
        const endTime = new Date();

        if (data) {
          node.children?.push(...data);
        }

        // this is necessary because if axios took less than 200ms animation seems weird
        if (endTime.getTime() - startTime.getTime() < 200) {
          // add another 400 ms waiting
          await sleep(400);
        }

        node.setActiveIcon('folder-close');
        node.setHasCaret(true);
        node.setDisabled(false);
      }

      node.setIsExpanded(value);
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleContextMenu = useCallback(
    async (e: React.MouseEvent<HTMLDivElement, MouseEvent>, node: RootFileStructure) => {
      e.preventDefault();
      console.log('Right Click', e.pageX, e.pageY, toJS(node));
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <MobxTree<number, RootFileStructure>
        compact={false}
        nodes={sharedStore.activeRootFileStructure}
        nodeClassName="gorilla-sidebar-tree-node"
        className={className ?? ''}
        onToggle={({ node, value }) => handleNodeToggle(node, value)}
        onClick={({ node }) => handleNodeClick(node)}
        onContextMenu={({ node, e }) => handleContextMenu(e, node)}
        renderTypeIcon={node => {
          if (node.activeIcon === 'spinner') {
            return <Spinner size={20} intent={Intent.PRIMARY} />;
          }

          return <Icon icon={node.activeIcon} />;
        }}
      />
    </>
  );
});
