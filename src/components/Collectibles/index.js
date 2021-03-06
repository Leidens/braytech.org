import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import cx from 'classnames';

import manifest from '../../utils/manifest';
import { commonality } from '../../utils/destinyUtils';
import { ProfileLink } from '../../components/ProfileLink';
import ObservedImage from '../../components/ObservedImage';
import { enumerateCollectibleState } from '../../utils/destinyEnums';
import { energyStatToType, energyTypeToAsset } from '../../utils/destinyConverters';

import './styles.css';

function selfLinkCollectible(hash) {
  const link = ['/collections'];
  const root = manifest.DestinyPresentationNodeDefinition[manifest.settings.destiny2CoreSettings.collectionRootNode];

  root.children.presentationNodes.forEach((primary) => {
    const definitionPrimaryNode = manifest.DestinyPresentationNodeDefinition[primary.presentationNodeHash];

    definitionPrimaryNode.children.presentationNodes.forEach((secondary) => {
      const definitionSecondaryNode = manifest.DestinyPresentationNodeDefinition[secondary.presentationNodeHash];

      definitionSecondaryNode.children.presentationNodes.forEach((tertiary) => {
        const definitionTertiaryNode = manifest.DestinyPresentationNodeDefinition[tertiary.presentationNodeHash];

        if (definitionTertiaryNode.children.collectibles.length) {
          const collectible = definitionTertiaryNode.children.collectibles.find((collectible) => collectible.collectibleHash === hash);

          if (collectible) {
            link.push(definitionPrimaryNode.hash, definitionSecondaryNode.hash, definitionTertiaryNode.hash, collectible.collectibleHash);
          }
        } else if (definitionTertiaryNode.children.presentationNodes.length) {
          definitionTertiaryNode.children.presentationNodes.forEach((quaternary) => {
            const definitionQuaternaryNode = manifest.DestinyPresentationNodeDefinition[quaternary.presentationNodeHash];

            if (definitionQuaternaryNode.children.collectibles.length) {
              const collectible = definitionQuaternaryNode.children.collectibles.find((collectible) => collectible.collectibleHash === hash);

              if (collectible) {
                link.push(definitionPrimaryNode.hash, definitionSecondaryNode.hash, definitionTertiaryNode.hash, definitionQuaternaryNode.hash, collectible.collectibleHash);
              }
            } else if (definitionQuaternaryNode.children.presentationNodes.length) {
              definitionQuaternaryNode.children.presentationNodes.forEach((quaternary) => {
                const definitionQuinaryNode = manifest.DestinyPresentationNodeDefinition[quaternary.presentationNodeHash];

                if (definitionQuinaryNode.children.collectibles.length) {
                  const collectible = definitionQuinaryNode.children.collectibles.find((collectible) => collectible.collectibleHash === hash);

                  if (collectible) {
                    link.push(definitionPrimaryNode.hash, definitionSecondaryNode.hash, definitionTertiaryNode.hash, definitionQuaternaryNode.hash, definitionQuinaryNode.hash, collectible.collectibleHash);
                  }
                }
              });
            }
          });
        }
      });
    });
  });

  return link.join('/');
}

class Collectibles extends React.Component {
  scrollToRecordRef = React.createRef();

  componentDidMount() {
    const highlight = parseInt(this.props.match && this.props.match.params.quinary ? this.props.match.params.quinary : this.props.highlight, 10) || false;

    if (highlight && this.scrollToRecordRef.current !== null) {
      window.scrollTo({
        top: this.scrollToRecordRef.current.offsetTop + this.scrollToRecordRef.current.offsetHeight / 2 - window.innerHeight / 2,
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.collectibles !== this.props.collectibles) {
      this.props.rebindTooltips();
    }
  }

  render() {
    const { t, member, collectibles, viewport, selfLinkFrom, forceDisplay, forceTooltip, inspect } = this.props;
    const highlight = +this.props.match?.params?.quinary || +this.props.highlight || false;
    const collectiblesRequested = this.props.hashes?.filter((h) => h);
    const characterId = member.characterId;
    const characterCollectibles = member.data?.profile.characterCollectibles.data;
    const profileCollectibles = member.data?.profile.profileCollectibles.data;

    let collectiblesOutput = [];

    if (this.props.node) {
      const tertiaryDefinition = manifest.DestinyPresentationNodeDefinition[this.props.node];

      if (tertiaryDefinition.children.presentationNodes.length > 0) {
        tertiaryDefinition.children.presentationNodes.forEach((node) => {
          const definitionNode = manifest.DestinyPresentationNodeDefinition[node.presentationNodeHash];

          let row = [];
          let rowState = [];

          definitionNode.children.collectibles.forEach((child) => {
            const definitionCollectible = manifest.DestinyCollectibleDefinition[child.collectibleHash];

            const scope = profileCollectibles.collectibles[child.collectibleHash] ? profileCollectibles.collectibles[child.collectibleHash] : characterCollectibles[characterId].collectibles[child.collectibleHash];
            const state = scope?.state || 0;

            rowState.push(state);

            if (collectibles && collectibles.hideInvisibleCollectibles && enumerateCollectibleState(state).invisible && !forceDisplay) {
              return;
            }

            if (collectibles && collectibles.hideCompletedCollectibles && !enumerateCollectibleState(state).notAcquired && !forceDisplay) {
              return;
            }

            if (definitionCollectible.redacted || definitionCollectible.itemHash === 0) {
              row.push({
                discovered: !enumerateCollectibleState(state).notAcquired,
                hash: definitionCollectible.hash,
                element: (
                  <li
                    key={definitionCollectible.hash}
                    className={cx('redacted', 'tooltip', {
                      highlight: highlight && highlight === definitionCollectible.hash,
                    })}
                    data-hash='343'
                  >
                    <div className='icon'>
                      <ObservedImage className={cx('image', 'icon')} src={`https://www.bungie.net${manifest.settings.destiny2CoreSettings.undiscoveredCollectibleImage}`} />
                    </div>
                    <div className='text'>
                      <div className='name'>{t('Classified')}</div>
                      {manifest.statistics.collections ? <div className='commonality'>{commonality(manifest.statistics.collections[definitionCollectible.hash]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div> : null}
                    </div>
                  </li>
                ),
              });
            } else {
              row.push({
                discovered: !enumerateCollectibleState(state).notAcquired,
                hash: definitionCollectible.hash,
                element: (
                  <li
                    key={definitionCollectible.hash}
                    className={cx('item', 'tooltip', {
                      completed: !enumerateCollectibleState(state).notAcquired && !enumerateCollectibleState(state).invisible,
                      highlight: highlight && highlight === definitionCollectible.hash,
                    })}
                    data-hash={definitionCollectible.itemHash}
                  >
                    <div className='icon'>
                      <ObservedImage className={cx('image', 'icon')} src={`https://www.bungie.net${definitionCollectible.displayProperties.icon || manifest.settings.destiny2CoreSettings.undiscoveredCollectibleImage}`} />
                    </div>
                    <div className='text'>
                      <div className='name'>{definitionCollectible.displayProperties.name}</div>
                      {manifest.statistics.collections ? <div className='commonality'>{commonality(manifest.statistics.collections[definitionCollectible.hash]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div> : null}
                    </div>
                    {inspect && definitionCollectible.itemHash ? <Link to={{ pathname: `/inspect/${definitionCollectible.itemHash}`, state: { from: selfLinkFrom } }} /> : null}
                  </li>
                ),
              });
            }
          });

          row = row.filter((c) => c).map((obj) => obj.element);

          if (row.filter((c) => c).length === 0 && collectibles && collectibles.hideCompletedCollectibles && !forceDisplay) {
            row.push(
              <li key='lol' className='all-completed'>
                <div className='properties'>
                  <div className='text'>{t('All discovered')}</div>
                </div>
              </li>
            );
          }

          const ref = definitionNode.children.collectibles.find((c) => c.collectibleHash === highlight) ? this.scrollToRecordRef : null;

          collectiblesOutput.push(
            <li
              key={definitionNode.hash}
              ref={ref}
              className={cx('is-set', {
                completed: rowState.filter((collectible) => !enumerateCollectibleState(collectible).notAcquired).length === rowState.length,
              })}
            >
              <div className='text'>
                <div className='name'>{definitionNode.displayProperties.name}</div>
              </div>
              <div className='set'>
                <ul className='list collection-items'>{row}</ul>
              </div>
            </li>
          );
        });
      } else {
        tertiaryDefinition.children.collectibles.forEach((child) => {
          const definitionCollectible = manifest.DestinyCollectibleDefinition[child.collectibleHash];

          const scope = profileCollectibles?.collectibles[child.collectibleHash] ? profileCollectibles.collectibles[child.collectibleHash] : characterCollectibles?.[characterId].collectibles[child.collectibleHash];
          const state = scope?.state || 0;

          if (collectibles && collectibles.hideInvisibleCollectibles && enumerateCollectibleState(state).invisible && !forceDisplay) {
            return;
          }

          if (collectibles && collectibles.hideCompletedCollectibles && !enumerateCollectibleState(state).notAcquired && !forceDisplay) {
            return;
          }

          const ref = highlight === definitionCollectible.hash ? this.scrollToRecordRef : null;

          if (definitionCollectible.redacted || definitionCollectible.itemHash === 0) {
            collectiblesOutput.push({
              discovered: !enumerateCollectibleState(state).notAcquired,
              hash: definitionCollectible.hash,
              element: (
                <li
                  key={definitionCollectible.hash}
                  ref={ref}
                  className={cx('redacted', 'tooltip', {
                    highlight: highlight && highlight === definitionCollectible.hash,
                  })}
                  data-hash='343'
                >
                  <div className='icon'>
                    <ObservedImage className={cx('image', 'icon')} src={`https://www.bungie.net${manifest.settings.destiny2CoreSettings.undiscoveredCollectibleImage}`} />
                  </div>
                  <div className='text'>
                    <div className='name'>{t('Classified')}</div>
                    {manifest.statistics.collections ? <div className='commonality'>{commonality(manifest.statistics.collections[definitionCollectible.hash]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div> : null}
                  </div>
                </li>
              ),
            });
          } else {
            const definitionItem = manifest.DestinyInventoryItemDefinition[definitionCollectible.itemHash];
            const energyAsset = definitionItem?.investmentStats?.[0]?.statTypeHash && energyTypeToAsset(energyStatToType(definitionItem.investmentStats[0].statTypeHash));

            collectiblesOutput.push({
              discovered: !enumerateCollectibleState(state).notAcquired,
              hash: definitionCollectible.hash,
              element: (
                <li
                  key={definitionCollectible.hash}
                  ref={ref}
                  className={cx('tooltip', energyAsset?.string !== 'any' && energyAsset?.string, {
                    completed: !enumerateCollectibleState(state).notAcquired,
                    highlight: highlight && highlight === definitionCollectible.hash,
                  })}
                  data-hash={definitionCollectible.itemHash}
                >
                  <div className='icon'>
                    <ObservedImage className={cx('image', 'icon')} src={`https://www.bungie.net${definitionCollectible.displayProperties.icon || manifest.settings.destiny2CoreSettings.undiscoveredCollectibleImage}`} />
                  </div>
                  <div className='text'>
                    <div className='name'>{definitionCollectible.displayProperties.name}</div>
                    {manifest.statistics.collections ? <div className='commonality'>{commonality(manifest.statistics.collections[definitionCollectible.hash]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div> : null}
                  </div>
                  {inspect && definitionCollectible.itemHash ? <Link to={{ pathname: `/inspect/${definitionCollectible.itemHash}`, state: { from: selfLinkFrom } }} /> : null}
                </li>
              ),
            });
          }
        });

        if (collectiblesOutput.filter((c) => c).length === 0 && collectibles && collectibles.hideCompletedCollectibles && !forceDisplay) {
          collectiblesOutput.push({
            element: (
              <li key='lol' className='all-completed'>
                <div className='properties'>
                  <div className='text'>{t('All discovered')}</div>
                </div>
              </li>
            ),
          });
        }

        collectiblesOutput = collectiblesOutput.filter((c) => c).map((obj) => obj.element);
      }
    } else {
      collectiblesRequested.forEach((hash) => {
        const definitionCollectible = manifest.DestinyCollectibleDefinition[hash];

        if (!definitionCollectible) return null;

        const scope = profileCollectibles?.collectibles[hash] ? profileCollectibles.collectibles[hash] : characterCollectibles?.[characterId].collectibles[hash];
        const state = scope?.state || 0;

        if (collectibles && collectibles.hideInvisibleCollectibles && enumerateCollectibleState(state).invisible && !forceDisplay) {
          return;
        }

        if (collectibles && collectibles.hideCompletedCollectibles && !enumerateCollectibleState(state).notAcquired && !forceDisplay) {
          return;
        }

        const definitionItem = manifest.DestinyInventoryItemDefinition[definitionCollectible.itemHash];
        const energyAsset = definitionItem?.investmentStats?.[0]?.statTypeHash && energyTypeToAsset(energyStatToType(definitionItem.investmentStats[0].statTypeHash));

        const link = selfLinkCollectible(definitionCollectible.hash);

        collectiblesOutput.push({
          discovered: !enumerateCollectibleState(state).notAcquired,
          hash: definitionCollectible.hash,
          element: (
            <li
              key={definitionCollectible.hash}
              className={cx(energyAsset?.string !== 'any' && energyAsset?.string, {
                tooltip: viewport.width <= 600 && link && selfLinkFrom && !forceTooltip ? false : true,
                linked: link && selfLinkFrom,
                completed: !enumerateCollectibleState(state).notAcquired,
              })}
              data-hash={definitionCollectible.itemHash}
            >
              <div className='icon'>
                <ObservedImage className={cx('image', 'icon')} src={`https://www.bungie.net${definitionCollectible.displayProperties.icon}`} />
              </div>
              <div className='text'>
                <div className='name'>{definitionCollectible.displayProperties.name}</div>
                {manifest.statistics.collections ? <div className='commonality'>{commonality(manifest.statistics.collections[definitionCollectible.hash]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</div> : null}
              </div>
              {link && selfLinkFrom && !inspect ? <ProfileLink to={{ pathname: link, state: { from: selfLinkFrom } }} /> : null}
              {inspect && definitionCollectible.itemHash ? <Link to={{ pathname: `/inspect/${definitionCollectible.itemHash}`, state: { from: selfLinkFrom } }} /> : null}
            </li>
          ),
        });
      });

      if (collectiblesRequested?.length > 0 && collectiblesOutput.length === 0 && collectibles && collectibles.hideCompletedCollectibles && !forceDisplay) {
        collectiblesOutput.push({
          element: (
            <li key='lol' className='all-completed'>
              <div className='properties'>
                <div className='text'>{t('All discovered')}</div>
              </div>
            </li>
          ),
        });
      }

      collectiblesOutput = collectiblesOutput.filter((c) => c).map((obj) => obj.element);
    }

    return collectiblesOutput;
  }
}

function mapStateToProps(state, ownProps) {
  return {
    member: state.member,
    collectibles: state.collectibles,
    viewport: state.viewport,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    rebindTooltips: (value) => {
      dispatch({ type: 'REBIND_TOOLTIPS', payload: new Date().getTime() });
    },
  };
}

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps), withTranslation())(Collectibles);
