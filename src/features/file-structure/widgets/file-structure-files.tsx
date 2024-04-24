import { Button, Intent, NonIdealState, NonIdealStateIconSize } from '@blueprintjs/core';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useInjection } from 'inversify-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FileStuructureFileItem } from '../../../widgets/file-structure-item.widget';
import { SafeRenderArray } from '../../../components/safe-render-array';
import { SharedStore } from '../../shared/state/shared.store';
import { FileStructureApiService } from '../../../shared/api';
import { toast } from '../../../shared/ui';
import { ChangeColor } from './change-color';
import { RootFileStructure } from '../../../shared/model';
import { FileStructureDetails } from './file-structure-details';
import { FileStructureFileView } from './file-structure-file-view';

export const FileStructureFiles = observer((): React.JSX.Element => {
  const navigate = useNavigate();
  const sharedStore = useInjection(SharedStore);
  const fileStructureApiService = useInjection(FileStructureApiService);
  const [isChangeColorOpen, setChangeColorOpen] = useState(false);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [isFileViewOpen, setFileViewOpen] = useState(false);

  const localSelectedStore = useLocalObservable(() => ({
    selectedNodes: new Set<RootFileStructure>(),

    setSelectedSingle(node: RootFileStructure) {
      if (this.selectedNodes.size === 1 && this.selectedNodes.has(node)) {
        return;
      }

      this.selectedNodes.clear();
      this.selectedNodes.add(node);
    },
    setSelectedMultiple(node: RootFileStructure) {
      if (this.selectedNodes.has(node)) {
        this.selectedNodes.delete(node);
      } else {
        this.selectedNodes.add(node);
      }
    },
    clear() {
      this.selectedNodes.clear();
    },
  }));

  const toggleOpen = (value: boolean, type: 'change-color' | 'details' | 'file-view') => {
    const finalValue = value;

    // is closing
    if (!finalValue) {
      localSelectedStore.clear();
    }

    switch (type) {
      case 'change-color':
        setChangeColorOpen(finalValue);
        break;
      case 'details':
        setDetailsOpen(finalValue);
        break;
      case 'file-view':
        setFileViewOpen(finalValue);
        break;
    }
  };

  return (
    <div className="gorilla-file-structure">
      <SafeRenderArray
        data={sharedStore.activeBodyFileStructure}
        renderChild={node => {
          return (
            <FileStuructureFileItem
              isSelected={localSelectedStore.selectedNodes.has(node)}
              key={node.id}
              node={node}
              onSelected={node => localSelectedStore.setSelectedSingle(node)}
              onColorChange={() => toggleOpen(true, 'change-color')}
              onDetails={() => toggleOpen(true, 'details')}
              onDoubleClick={async node => {
                if (node.isFile) {
                  toggleOpen(true, 'file-view');
                } else {
                  navigate(node.link);
                }
              }}
              onMoveToBin={async node => {
                await fileStructureApiService.moveToBin(node.id);
                window.location.reload();
              }}
              onCopy={node => {
                navigator.clipboard.writeText(node.title);
                toast.showMessage('Copied to clipboard');
              }}
              onDownload={async node => {
                //TODO download folder
                if (node.isFile) {
                  await fileStructureApiService.downloadById(node.id);
                }
              }}
            />
          );
        }}
        renderError={() => {
          if (sharedStore.activeRootFileStructure.length === 0) {
            return (
              <NonIdealState
                className="mt-16"
                title="Come on do something"
                icon="projects"
                iconMuted={false}
                description="Click on sidebar item new and choose action"
                iconSize={NonIdealStateIconSize.STANDARD}
              />
            );
          }

          return (
            <NonIdealState
              className="mt-16"
              title="No folder found"
              icon="search"
              description="Looks like there were no folder or files found in this directory"
              action={
                <Button onClick={() => navigate(-1)} intent={Intent.PRIMARY} minimal outlined>
                  Go back
                </Button>
              }
              iconSize={NonIdealStateIconSize.STANDARD}
            />
          );
        }}
      />

      {[...localSelectedStore.selectedNodes].length !== 0 && (
        <>
          <ChangeColor
            selectedNodes={[...localSelectedStore.selectedNodes]}
            isOpen={isChangeColorOpen}
            toggleIsOpen={value => toggleOpen(value, 'change-color')}
          />

          <FileStructureDetails
            selectedNodes={[...localSelectedStore.selectedNodes]}
            isOpen={isDetailsOpen}
            toggleIsOpen={value => toggleOpen(value, 'details')}
            isInBin={false}
          />

          <FileStructureFileView
            selectedNode={[...localSelectedStore.selectedNodes][0]}
            isOpen={isFileViewOpen}
            toggleIsOpen={value => toggleOpen(value, 'file-view')}
            isInBin={false}
          />
        </>
      )}
    </div>
  );
});
