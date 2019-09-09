import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from 'react-icons/fa';

import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, FilterList } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        name: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    issueState: 'open',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { page, issueState } = this.state;

    const repoName = decodeURIComponent(match.params.name);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: `${issueState}`,
          per_page: 5,
          page,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async handlePageChange(action) {
    const { match } = this.props;
    const { page, issueState } = this.state;

    const newPage = action === 'next' ? page + 1 : page - 1;

    const repoName = decodeURIComponent(match.params.name);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: `${issueState}`,
        per_page: 5,
        page: newPage,
      },
    });

    this.setState({ issues: response.data, page: newPage });
  }

  async handleIssueStateChange(state) {
    const { match } = this.props;
    const { page } = this.state;

    const repoName = decodeURIComponent(match.params.name);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: `${state}`,
        per_page: 5,
        page,
      },
    });

    this.setState({ issues: response.data, issueState: state });
  }

  renderButtons() {
    const { issueState } = this.state;
    return (
      <FilterList>
        <button
          type="button"
          onClick={() => this.handleIssueStateChange('open')}
          disabled={issueState === 'open'}
        >
          Abertas
        </button>
        <button
          type="button"
          onClick={() => this.handleIssueStateChange('closed')}
          disabled={issueState === 'closed'}
        >
          Fechadas
        </button>
        <button
          type="button"
          onClick={() => this.handleIssueStateChange('all')}
          disabled={issueState === 'all'}
        >
          Todas
        </button>
      </FilterList>
    );
  }

  render() {
    const { repository, issues, loading, page } = this.state;

    if (loading) {
      return <Loading>Carregando...</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <div>
            <FaArrowAltCircleLeft
              color="#7159c1"
              size={25}
              disabled={page === 1}
              onClick={() => this.handlePageChange('previous')}
            />
            {this.renderButtons()}
            <FaArrowAltCircleRight
              color="#7159c1"
              size={25}
              onClick={() => this.handlePageChange('next')}
            />
          </div>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
      </Container>
    );
  }
}
