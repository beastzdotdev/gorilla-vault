import { TreeNodeInfo, Tree } from '@blueprintjs/core';
import { useCallback, useEffect, useReducer } from 'react';
import { useLocation } from 'react-router-dom';
import { router } from '../router';

type NodeCustomData = { link: string | null };
type SidebarNodeInfo = TreeNodeInfo<NodeCustomData>;

type ReactClick = React.MouseEvent<HTMLElement>;
type NodePath = number[];
type TreeAction =
  | { type: 'SET_IS_EXPANDED'; payload: { path: NodePath; isExpanded: boolean } }
  | { type: 'DESELECT_ALL' }
  | { type: 'SET_IS_SELECTED'; payload: { path: NodePath; isSelected: boolean } }
  | { type: 'SELECT_ON_ROUTE_CHANGE'; payload: { path: string } }
  | { type: 'UPDATE_STATE'; payload: { data: SidebarNodeInfo[] } };

const forEachNode = (
  nodes: SidebarNodeInfo[] | undefined,
  callback: (node: SidebarNodeInfo) => void
) => {
  if (nodes === undefined) {
    return;
  }

  for (const node of nodes) {
    callback(node);
    forEachNode(node.childNodes, callback);
  }
};

const forEachNodeFindByUrl = (nodes: SidebarNodeInfo[] | undefined, path: string) => {
  if (nodes === undefined) {
    return;
  }

  for (const node of nodes) {
    if (node.nodeData?.link?.startsWith(path)) {
      node.isSelected = true;
      return;
    }

    forEachNodeFindByUrl(node.childNodes, path);
  }
};

function treeExampleReducer(state: SidebarNodeInfo[], action: TreeAction) {
  const newState = state.slice();

  switch (action.type) {
    case 'DESELECT_ALL':
      forEachNode(newState, node => (node.isSelected = false));
      break;
    case 'SET_IS_EXPANDED':
      Tree.nodeFromPath(action.payload.path, newState).isExpanded = action.payload.isExpanded;
      break;
    case 'SET_IS_SELECTED':
      Tree.nodeFromPath(action.payload.path, newState).isSelected = action.payload.isSelected;
      break;
    case 'SELECT_ON_ROUTE_CHANGE':
      forEachNodeFindByUrl(newState, action.payload.path);
      break;
    case 'UPDATE_STATE':
      return action.payload.data;
  }

  return newState;
}

export const SidebarTree = (params: { state: SidebarNodeInfo[] }) => {
  const location = useLocation();
  const [nodes, dispatch] = useReducer(treeExampleReducer, params.state);

  // listen to route changes
  useEffect(() => {
    dispatch({
      type: 'DESELECT_ALL',
    });

    if (location.pathname === '/') {
      return;
    }

    dispatch({
      type: 'SELECT_ON_ROUTE_CHANGE',
      payload: { path: location.pathname },
    });
  }, [location]);

  useEffect(() => {
    dispatch({
      type: 'UPDATE_STATE',
      payload: {
        data: params.state,
      },
    });
  }, [params.state]);

  const handleNodeClick = useCallback(
    (node: SidebarNodeInfo, nodePath: NodePath, _e: ReactClick) => {
      const nodeData = node.nodeData;

      //TODO check if is file and if file redirect

      dispatch({
        type: 'DESELECT_ALL',
      });
      dispatch({
        payload: { path: nodePath, isSelected: true },
        type: 'SET_IS_SELECTED',
      });

      if (nodeData && nodeData.link && location.pathname != nodeData.link) {
        router.navigate(nodeData.link);
      }
    },
    [location.pathname]
  );

  const handleNodeCollapse = useCallback((_node: SidebarNodeInfo, nodePath: NodePath) => {
    dispatch({
      payload: { path: nodePath, isExpanded: false },
      type: 'SET_IS_EXPANDED',
    });
  }, []);

  const handleNodeExpand = useCallback((_node: SidebarNodeInfo, nodePath: NodePath) => {
    dispatch({
      payload: { path: nodePath, isExpanded: true },
      type: 'SET_IS_EXPANDED',
    });
  }, []);

  return (
    <>
      <Tree
        className="gorilla-sidebar-tree-nodes p-1.5"
        contents={nodes}
        onNodeClick={handleNodeClick}
        onNodeCollapse={handleNodeCollapse}
        onNodeExpand={handleNodeExpand}
      />
    </>
  );
};
